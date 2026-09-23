import "server-only";
import type { Prisma } from "@prisma/client";
import {
  identifySchema,
  signatureSubmitSchema,
  type IdentifyInput,
  type SignatureSubmitInput,
} from "@/lib/validations/esign";
import { actorEmail, db, publicBaseUrl, sendEmail } from "./deps";
import { CONSENT_TEXT, ESIGN } from "./config";
import { decrypt, newOtp, otpHash, safeEqualHex, sha256Hex, tokenHash } from "./crypto";
import { EsignError } from "./errors";
import { appendEvent, lockDocument, recordEvent } from "./evidence";
import { completedEmail, otpEmail } from "./emails";
import { describeDevice, maskCpf, maskEmail } from "./format";
import { rebuildSignedPdf } from "./rendering";
import { signerLink } from "./documents";
import { paths, storage } from "./storage";
import type { EsignContext, PageBox } from "./types";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function findByToken(token: string) {
  if (!token || token.length < 20 || token.length > 100) {
    throw new EsignError("invalid_token", "Este link não é válido.");
  }
  const signer = await db.esignSigner.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { document: true, fields: true },
  });
  if (!signer) throw new EsignError("invalid_token", "Este link não é válido ou foi substituído por um novo.");
  if (signer.document.status === "cancelled") {
    throw new EsignError("not_available", "Este documento foi cancelado pelo remetente.");
  }
  if (signer.document.status === "draft") throw new EsignError("invalid_token", "Este link não é válido.");
  return signer;
}

/** Dados que a página pública pode mostrar (nada dos outros signatários). */
export async function getSigningView(token: string, ctx: EsignContext) {
  const s = await findByToken(token);
  const d = s.document;

  // Registra a abertura (no máx. a cada 10 min, para não poluir a trilha).
  const lastOpen = await db.esignEvent.findFirst({
    where: { documentId: d.id, signerId: s.id, type: "link_opened" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (s.status === "pending" && (!lastOpen || Date.now() - lastOpen.createdAt.getTime() > 10 * 60_000)) {
    await db.$transaction(async (tx) => {
      await lockDocument(tx, d.id);
      if (!s.viewedAt) await tx.esignSigner.update({ where: { id: s.id }, data: { viewedAt: new Date() } });
      await appendEvent(tx, {
        documentId: d.id,
        signerId: s.id,
        type: "link_opened",
        ctx,
        data: { device: describeDevice(ctx.userAgent) },
      });
    });
  }

  return {
    document: {
      id: d.id,
      code: d.code,
      title: d.title,
      status: d.status,
      pageCount: d.pageCount,
      pageSizes: d.pageSizes as unknown as PageBox[],
      originalSha256: d.originalSha256,
      requireOtp: d.requireOtp,
      message: d.message,
      senderName: d.createdByName,
      hasSigned: Boolean(d.signedPath),
    },
    signer: {
      status: s.status,
      presetName: s.name,
      presetEmail: s.email,
      presetCpfMasked: s.cpf ? maskCpf(s.cpf) : null,
      signedName: s.signedName,
      signedAt: s.signedAt,
      otpVerified: Boolean(s.otpVerifiedAt && Date.now() - s.otpVerifiedAt.getTime() < ESIGN.otpValidForMs),
      fields: s.fields.map((f) => ({ id: f.id, kind: f.kind, page: f.page, x: f.x, y: f.y, w: f.w, h: f.h })),
    },
    consentText: CONSENT_TEXT,
  };
}

function checkIdentity(
  s: { cpf: string | null; email: string | null },
  input: { cpf?: string; email?: string },
  requireOtp: boolean,
) {
  if (s.cpf && s.cpf !== (input.cpf ?? "")) {
    throw new EsignError("cpf_mismatch", "O CPF informado não confere com o cadastrado para este signatário.");
  }
  if (requireOtp && !input.email) throw new EsignError("invalid_input", "Informe seu e-mail para receber o código.");
}

/** Valida nome/CPF/e-mail e, se exigido, envia o código por e-mail. */
export async function identify(token: string, raw: IdentifyInput, ctx: EsignContext) {
  const parsed = identifySchema.safeParse(raw);
  if (!parsed.success) throw new EsignError("invalid_input", parsed.error.issues[0]?.message ?? "Dados inválidos");
  const s = await findByToken(token);
  if (s.status === "signed") throw new EsignError("not_available", "Você já assinou este documento.");
  checkIdentity(s, parsed.data, s.document.requireOtp);
  if (!s.document.requireOtp) return { needsOtp: false as const };

  const verified =
    s.otpVerifiedAt &&
    s.otpEmail === parsed.data.email &&
    Date.now() - s.otpVerifiedAt.getTime() < ESIGN.otpValidForMs;
  if (verified) return { needsOtp: false as const };
  // Já há um código válido para este e-mail (ex.: voltou uma etapa): reaproveita.
  const pendingCode =
    s.otpCodeHash &&
    s.otpExpiresAt &&
    s.otpExpiresAt.getTime() > Date.now() + 60_000 &&
    s.otpEmail === parsed.data.email &&
    s.otpAttempts < ESIGN.otpMaxAttempts;
  if (pendingCode) return { needsOtp: true as const, sentTo: maskEmail(parsed.data.email), devMode: false };
  return { needsOtp: true as const, ...(await requestOtp(token, parsed.data.email!, ctx)) };
}

export async function requestOtp(token: string, email: string, ctx: EsignContext) {
  const s = await findByToken(token);
  if (!s.document.requireOtp) throw new EsignError("invalid_input", "Este documento não exige código.");
  if (s.status === "signed") throw new EsignError("not_available", "Você já assinou este documento.");

  const now = Date.now();
  const windowOpen = s.otpSentAt && now - s.otpSentAt.getTime() < ESIGN.otpSendWindowMs;
  const sendCount = windowOpen ? s.otpSendCount : 0;
  if (sendCount >= ESIGN.otpMaxSends) {
    throw new EsignError("rate_limited", "Muitos códigos enviados. Aguarde alguns minutos e tente de novo.");
  }
  if (s.otpSentAt && now - s.otpSentAt.getTime() < 45_000) {
    throw new EsignError("rate_limited", "Aguarde alguns segundos para pedir um novo código.");
  }

  const code = newOtp();
  await db.esignSigner.update({
    where: { id: s.id },
    data: {
      otpEmail: email,
      otpCodeHash: otpHash(s.id, code),
      otpExpiresAt: new Date(now + ESIGN.otpTtlMs),
      otpAttempts: 0,
      otpSentAt: new Date(now),
      otpSendCount: sendCount + 1,
      otpVerifiedAt: null,
    },
  });
  const res = await sendEmail({ to: email, ...otpEmail({ code, title: s.document.title }) });
  await recordEvent({
    documentId: s.documentId,
    signerId: s.id,
    type: "otp_sent",
    ctx,
    data: { to: maskEmail(email), ok: res.ok, skipped: res.skipped ?? false },
  });
  if (!res.ok) {
    // Em desenvolvimento, qualquer falha de e-mail vira código no log (para testar).
    if (process.env.NODE_ENV !== "production") {
      console.info(`[esign] (dev) código para ${email}: ${code}`);
      return { sentTo: maskEmail(email), devMode: true };
    }
    // Não deixa um código "fantasma" (que ninguém recebeu) ser reaproveitado.
    await db.esignSigner.update({
      where: { id: s.id },
      data: { otpCodeHash: null, otpExpiresAt: null, otpSentAt: s.otpSentAt, otpSendCount: sendCount },
    });
    throw new EsignError(
      "email",
      "Não conseguimos enviar o código agora. Tente de novo em instantes ou fale com quem enviou o documento.",
    );
  }
  return { sentTo: maskEmail(email), devMode: false };
}

export async function verifyOtp(token: string, code: string, ctx: EsignContext) {
  const s = await findByToken(token);
  const clean = (code ?? "").replace(/\D/g, "");
  if (!s.otpCodeHash || !s.otpExpiresAt) throw new EsignError("otp_required", "Peça um código primeiro.");
  if (s.otpAttempts >= ESIGN.otpMaxAttempts) {
    throw new EsignError("otp_locked", "Tentativas esgotadas. Peça um novo código.");
  }
  if (Date.now() > s.otpExpiresAt.getTime()) throw new EsignError("otp_expired", "O código expirou. Peça um novo.");
  const ok = clean.length === 6 && safeEqualHex(otpHash(s.id, clean), s.otpCodeHash);
  if (!ok) {
    await db.esignSigner.update({ where: { id: s.id }, data: { otpAttempts: { increment: 1 } } });
    const left = ESIGN.otpMaxAttempts - s.otpAttempts - 1;
    throw new EsignError(
      left > 0 ? "otp_invalid" : "otp_locked",
      left > 0 ? `Código incorreto. Você tem mais ${left} tentativa(s).` : "Tentativas esgotadas. Peça um novo código.",
    );
  }
  await db.$transaction(async (tx) => {
    await lockDocument(tx, s.documentId);
    await tx.esignSigner.update({
      where: { id: s.id },
      data: { otpVerifiedAt: new Date(), otpCodeHash: null },
    });
    await appendEvent(tx, {
      documentId: s.documentId,
      signerId: s.id,
      type: "otp_verified",
      ctx,
      data: { email: maskEmail(s.otpEmail) },
    });
  });
  return { ok: true as const };
}

function decodePng(b64: string | undefined): Buffer {
  const clean = (b64 ?? "").replace(/^data:image\/png;base64,/, "");
  const buf = Buffer.from(clean, "base64");
  if (buf.length < 100 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new EsignError("invalid_input", "Assinatura inválida. Desenhe novamente.");
  }
  if (buf.length > ESIGN.maxSignatureBytes) throw new EsignError("too_large", "Imagem da assinatura muito grande.");
  return buf;
}

/** Registra a assinatura, regera o PDF e conclui o documento se for a última. */
export async function submitSignature(token: string, raw: SignatureSubmitInput, ctx: EsignContext) {
  const parsed = signatureSubmitSchema.safeParse(raw);
  if (!parsed.success) throw new EsignError("invalid_input", parsed.error.issues[0]?.message ?? "Dados inválidos");
  const input = parsed.data;
  const s = await findByToken(token);
  if (s.status === "signed") throw new EsignError("not_available", "Você já assinou este documento.");
  if (s.document.status !== "pending") throw new EsignError("not_available", "Este documento não aceita mais assinaturas.");
  checkIdentity(s, input, s.document.requireOtp);
  if (s.document.requireOtp) {
    const fresh = s.otpVerifiedAt && Date.now() - s.otpVerifiedAt.getTime() < ESIGN.otpValidForMs;
    if (!fresh || s.otpEmail !== input.email) {
      throw new EsignError("otp_required", "Confirme o código enviado ao seu e-mail antes de assinar.");
    }
  }

  // Imagem da assinatura: desenhada/digitada aqui, ou recebida do celular (sessão).
  let png: Buffer;
  let phone: { ip: string | null; userAgent: string | null; device: string | null } | null = null;
  let sessionId: string | null = null;
  if (input.method === "phone") {
    const session = await db.esignSession.findUnique({ where: { codeHash: tokenHash(input.sessionCode ?? "") } });
    if (!session || session.kind !== "signature" || session.signerId !== s.id || !session.resultPath || !session.consumedAt) {
      throw new EsignError("session_expired", "Não encontramos a assinatura feita no celular. Gere um novo QR code.");
    }
    if (Date.now() - session.consumedAt.getTime() > ESIGN.phoneSignatureUseMs) {
      throw new EsignError("session_expired", "A assinatura do celular expirou. Gere um novo QR code.");
    }
    png = await storage().get(session.resultPath);
    const meta = (session.resultMeta ?? {}) as { ip?: string; userAgent?: string; device?: string };
    phone = { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null, device: meta.device ?? null };
    sessionId = session.id;
  } else {
    png = decodePng(input.pngBase64);
  }

  const signaturePath = paths.signature(s.document.code, s.id);
  await storage().put(signaturePath, png, "image/png");
  const signatureSha256 = sha256Hex(png);
  const signedAt = new Date();

  const result = await db.$transaction(
    async (tx) => {
      await lockDocument(tx, s.documentId);
      const current = await tx.esignSigner.findUnique({ where: { id: s.id }, select: { status: true } });
      if (current?.status === "signed") throw new EsignError("not_available", "Você já assinou este documento.");
      await tx.esignSigner.update({
        where: { id: s.id },
        data: {
          status: "signed",
          signedName: input.name,
          signedCpf: input.cpf,
          signedEmail: input.email ?? null,
          signatureMethod: input.method,
          signaturePath,
          signatureSha256,
          typedText: input.method === "type" ? input.typedText ?? input.name : null,
          signedAt,
          signedIp: ctx.ip ?? null,
          signedUserAgent: ctx.userAgent ?? null,
          signedDevice: describeDevice(ctx.userAgent),
          signedGeo: (input.geo ?? undefined) as Prisma.InputJsonValue | undefined,
          phoneIp: phone?.ip ?? null,
          phoneUserAgent: phone?.userAgent ?? null,
          phoneDevice: phone?.device ?? null,
        },
      });
      if (sessionId) await tx.esignSession.delete({ where: { id: sessionId } });
      await appendEvent(tx, {
        documentId: s.documentId,
        signerId: s.id,
        type: "signer_signed",
        ctx,
        data: {
          name: input.name,
          cpf: maskCpf(input.cpf),
          email: input.email ? maskEmail(input.email) : null,
          method: input.method,
          device: describeDevice(ctx.userAgent),
          phoneDevice: phone?.device ?? null,
          phoneIp: phone?.ip ?? null,
          signatureSha256,
          consent: CONSENT_TEXT,
          geo: input.geo ?? null,
          otpVerified: Boolean(s.document.requireOtp),
        },
      });
      return rebuildSignedPdf(tx, s.documentId, ctx);
    },
    { timeout: 90_000, maxWait: 15_000 },
  );

  if (result?.completed) await notifyCompleted(s.documentId);
  return { completed: Boolean(result?.completed) };
}

async function notifyCompleted(documentId: string) {
  const doc = await db.esignDocument.findUnique({
    where: { id: documentId },
    include: { signers: true },
  });
  if (!doc) return;
  for (const s of doc.signers) {
    const to = s.signedEmail ?? s.email;
    if (!to || !s.tokenEnc) continue;
    const url = signerLink(decrypt(s.tokenEnc));
    await sendEmail({ to, ...completedEmail({ name: s.signedName ?? s.name, title: doc.title, code: doc.code, url }) });
  }
  // Avisa também quem enviou (link para o painel).
  const creator = await actorEmail(doc.createdById);
  if (creator) {
    await sendEmail({
      to: creator,
      ...completedEmail({ name: doc.createdByName, title: doc.title, code: doc.code, url: `${publicBaseUrl()}/admin/documentos/${doc.id}` }),
    });
  }
}

/** PDF (assinado, se já houver; senão o original) para o próprio signatário. */
export async function getFileForSigner(token: string, which: "original" | "signed") {
  const s = await findByToken(token);
  const path = which === "signed" ? s.document.signedPath : s.document.originalPath;
  if (!path) throw new EsignError("not_found", "Ainda não há versão assinada.");
  const bytes = await storage().get(path);
  const base = s.document.title.replace(/[^\p{L}\p{N} _.-]+/gu, "").trim().slice(0, 80) || s.document.code;
  return { bytes, fileName: which === "signed" ? `${base} - assinado.pdf` : `${base}.pdf` };
}

/** Id do signatário/documento a partir do link (para criar a sessão do celular). */
export async function signerForToken(token: string) {
  const s = await findByToken(token);
  if (s.status === "signed") throw new EsignError("not_available", "Você já assinou este documento.");
  return { id: s.id, documentId: s.documentId };
}
