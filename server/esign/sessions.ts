import "server-only";
import { db, publicBaseUrl } from "./deps";
import { ESIGN } from "./config";
import { newToken, tokenHash } from "./crypto";
import { EsignError } from "./errors";
import { recordEvent } from "./evidence";
import { createDocument } from "./documents";
import { describeDevice } from "./format";
import { paths, storage } from "./storage";
import type { EsignContext } from "./types";

/**
 * Sessões de QR code — uso único e curtas (10 min):
 *  - upload: o operador envia um PDF pelo celular sem precisar logar nele;
 *  - signature: o signatário desenha a assinatura no celular.
 * O código (32 bytes) vai na URL do QR; no banco fica só o hash.
 */

async function findSession(code: string, kind: "upload" | "signature") {
  if (!code || code.length < 20 || code.length > 100) {
    throw new EsignError("session_expired", "Este QR code não é válido.");
  }
  const s = await db.esignSession.findUnique({ where: { codeHash: tokenHash(code) } });
  if (!s || s.kind !== kind) throw new EsignError("session_expired", "Este QR code não é válido.");
  return s;
}

// --- Upload pelo celular ------------------------------------------------------

export async function createUploadSession(actor: { id: string; name: string }) {
  const code = newToken();
  const expiresAt = new Date(Date.now() + ESIGN.sessionTtlMs);
  await db.esignSession.create({
    data: { kind: "upload", codeHash: tokenHash(code), actorId: actor.id, actorName: actor.name, expiresAt },
  });
  // Limpeza oportunista de sessões vencidas há mais de 1 dia.
  await db.esignSession.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } } }).catch(() => {});
  return { code, url: `${publicBaseUrl()}/m/upload/${code}`, expiresAt };
}

/** Estado para o computador (polling): só quem criou a sessão pode ver. */
export async function getUploadSessionStatus(code: string, actorId: string) {
  const s = await findSession(code, "upload");
  if (s.actorId !== actorId) throw new EsignError("session_expired", "Sessão não encontrada.");
  if (s.consumedAt) {
    const meta = (s.resultMeta ?? {}) as { documentId?: string };
    return { status: "received" as const, documentId: meta.documentId ?? null };
  }
  if (s.expiresAt.getTime() < Date.now()) return { status: "expired" as const };
  return { status: "waiting" as const };
}

/** Para a página do celular: a sessão ainda está aberta? */
export async function peekUploadSession(code: string) {
  const s = await findSession(code, "upload");
  if (s.consumedAt) return { status: "used" as const };
  if (s.expiresAt.getTime() < Date.now()) return { status: "expired" as const };
  return { status: "open" as const, actorName: s.actorName ?? "", expiresAt: s.expiresAt };
}

export async function consumeUploadSession(
  code: string,
  file: { bytes: Uint8Array; fileName: string; mime?: string },
  ctx: EsignContext,
) {
  const s = await findSession(code, "upload");
  if (s.consumedAt) throw new EsignError("session_expired", "Este QR code já foi usado. Gere outro no computador.");
  if (s.expiresAt.getTime() < Date.now()) throw new EsignError("session_expired", "Este QR code expirou. Gere outro no computador.");
  // Marca como usada ANTES de processar (evita dois envios na mesma sessão).
  const claimed = await db.esignSession.updateMany({
    where: { id: s.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count === 0) throw new EsignError("session_expired", "Este QR code já foi usado.");
  try {
    const doc = await createDocument(
      { ...file, source: "celular" },
      { ...ctx, actor: { id: s.actorId!, name: s.actorName ?? "Operador" } },
    );
    await db.esignSession.update({ where: { id: s.id }, data: { resultMeta: { documentId: doc.id } } });
    return doc;
  } catch (e) {
    // Libera a sessão para tentar de novo com outro arquivo.
    await db.esignSession.update({ where: { id: s.id }, data: { consumedAt: null } });
    throw e;
  }
}

// --- Assinatura pelo dedo no celular -----------------------------------------------

export async function createSignatureSession(signer: { id: string; documentId: string }, ctx: EsignContext) {
  const code = newToken();
  const expiresAt = new Date(Date.now() + ESIGN.sessionTtlMs);
  await db.esignSession.create({
    data: { kind: "signature", codeHash: tokenHash(code), documentId: signer.documentId, signerId: signer.id, expiresAt },
  });
  await recordEvent({ documentId: signer.documentId, signerId: signer.id, type: "phone_session_created", ctx });
  return { code, url: `${publicBaseUrl()}/m/assinatura/${code}`, expiresAt };
}

export async function peekSignatureSession(code: string) {
  const s = await findSession(code, "signature");
  const doc = s.documentId
    ? await db.esignDocument.findUnique({ where: { id: s.documentId }, select: { title: true, status: true } })
    : null;
  if (!doc || doc.status !== "pending") return { status: "expired" as const };
  if (s.consumedAt) return { status: "used" as const };
  if (s.expiresAt.getTime() < Date.now()) return { status: "expired" as const };
  return { status: "open" as const, title: doc.title };
}

export async function submitPhoneSignature(code: string, png: Buffer, ctx: EsignContext) {
  const s = await findSession(code, "signature");
  if (s.consumedAt) throw new EsignError("session_expired", "Esta assinatura já foi enviada.");
  if (s.expiresAt.getTime() < Date.now()) throw new EsignError("session_expired", "Este QR code expirou. Gere outro.");
  const resultPath = paths.phoneSignature(s.id);
  await storage().put(resultPath, png, "image/png");
  const claimed = await db.esignSession.updateMany({
    where: { id: s.id, consumedAt: null },
    data: {
      consumedAt: new Date(),
      resultPath,
      resultMeta: { ip: ctx.ip ?? null, userAgent: ctx.userAgent ?? null, device: describeDevice(ctx.userAgent) },
    },
  });
  if (claimed.count === 0) throw new EsignError("session_expired", "Esta assinatura já foi enviada.");
  if (s.documentId) {
    await recordEvent({
      documentId: s.documentId,
      signerId: s.signerId,
      type: "phone_signature_received",
      ctx,
      data: { device: describeDevice(ctx.userAgent) },
    });
  }
}

/** Polling do computador do signatário: a assinatura do celular chegou? */
export async function getSignatureSessionStatus(code: string, signerId: string) {
  const s = await findSession(code, "signature");
  if (s.signerId !== signerId) throw new EsignError("session_expired", "Sessão não encontrada.");
  if (s.consumedAt && s.resultPath) {
    const png = await storage().get(s.resultPath);
    const meta = (s.resultMeta ?? {}) as { device?: string };
    return { status: "received" as const, dataUrl: `data:image/png;base64,${png.toString("base64")}`, device: meta.device ?? null };
  }
  if (s.expiresAt.getTime() < Date.now()) return { status: "expired" as const };
  return { status: "waiting" as const };
}
