import "server-only";
import type { EsignDocumentStatus, Prisma } from "@prisma/client";
import { draftSchema, type DraftInput } from "@/lib/validations/esign";
import { db, publicBaseUrl, sendEmail } from "./deps";
import { CONVERTIBLE_EXT, CONVERTIBLE_MIMES, ESIGN, PDF_MIME, WORD_NOT_SUPPORTED } from "./config";
import { decrypt, encrypt, newDocCode, newToken, sha256Hex, tokenHash } from "./crypto";
import { EsignError } from "./errors";
import { appendEvent, lockDocument, recordEvent } from "./evidence";
import { inviteEmail } from "./emails";
import { maskEmail } from "./format";
import { inspectPdf } from "./pdf/inspect";
import { paths, storage } from "./storage";
import type { EsignContext, PageBox } from "./types";

type Actor = { id: string; name: string };

export const signerLink = (token: string) => `${publicBaseUrl()}/assinar/${token}`;
export const validationLink = (code: string) =>
  `${publicBaseUrl()}/validar-documento?codigo=${encodeURIComponent(code)}`;

function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Documento").slice(0, 160);
}

/** Recusa Word/outros com mensagem clara (Word entra depois via conversão). */
export function assertAcceptedFile(fileName: string, mime: string | undefined, size: number) {
  if (size <= 0) throw new EsignError("invalid_pdf", "O arquivo está vazio.");
  if (size > ESIGN.maxPdfBytes) {
    throw new EsignError("too_large", `O arquivo passa de ${ESIGN.maxPdfBytes / 1024 / 1024} MB.`);
  }
  if ((mime && CONVERTIBLE_MIMES.includes(mime)) || CONVERTIBLE_EXT.test(fileName)) {
    throw new EsignError("unsupported_type", WORD_NOT_SUPPORTED);
  }
  if (mime && mime !== PDF_MIME && mime !== "application/octet-stream" && !/\.pdf$/i.test(fileName)) {
    throw new EsignError("unsupported_type", "Envie um arquivo PDF.");
  }
}

/** Cria um documento (rascunho) a partir dos bytes de um PDF. */
export async function createDocument(
  input: { bytes: Uint8Array; fileName: string; mime?: string; title?: string; requireOtp?: boolean; source?: string },
  ctx: EsignContext & { actor: Actor },
): Promise<{ id: string; code: string }> {
  assertAcceptedFile(input.fileName, input.mime, input.bytes.byteLength);
  const { pageCount, pageSizes } = await inspectPdf(input.bytes);
  const sha = sha256Hex(input.bytes);

  // Código único (colisão é improvável; ainda assim tenta de novo).
  let code = newDocCode();
  for (let i = 0; i < 5 && (await db.esignDocument.findUnique({ where: { code }, select: { id: true } })); i++) {
    code = newDocCode();
  }
  const originalPath = paths.original(code);
  await storage().put(originalPath, input.bytes, PDF_MIME);

  try {
    const doc = await db.$transaction(async (tx) => {
      const created = await tx.esignDocument.create({
        data: {
          code,
          title: (input.title?.trim() || titleFromFileName(input.fileName)).slice(0, 160),
          originalPath,
          originalName: input.fileName.slice(0, 200),
          originalMime: PDF_MIME,
          originalSha256: sha,
          originalSize: input.bytes.byteLength,
          pageCount,
          pageSizes: pageSizes as unknown as Prisma.InputJsonValue,
          requireOtp: input.requireOtp ?? true,
          createdById: ctx.actor.id,
          createdByName: ctx.actor.name,
        },
      });
      await lockDocument(tx, created.id);
      await appendEvent(tx, {
        documentId: created.id,
        type: "document_created",
        ctx,
        data: { by: ctx.actor.name, file: created.originalName, sha256: sha, pages: pageCount, source: input.source ?? "upload" },
      });
      return created;
    });
    return { id: doc.id, code: doc.code };
  } catch (e) {
    await storage().remove([originalPath]).catch(() => {});
    throw e;
  }
}

export type DocumentFilter = "all" | "draft" | "pending" | "completed" | "cancelled";

export async function listDocuments(opts: { filter?: string; q?: string; page?: number; perPage?: number }) {
  const perPage = opts.perPage ?? 20;
  const page = Math.max(1, opts.page ?? 1);
  const status = (["draft", "pending", "completed", "cancelled"] as const).includes(opts.filter as EsignDocumentStatus)
    ? (opts.filter as EsignDocumentStatus)
    : undefined;
  const q = opts.q?.trim();
  const where: Prisma.EsignDocumentWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { code: { contains: q.toUpperCase() } },
            { signers: { some: { OR: [{ name: { contains: q, mode: "insensitive" } }, { signedName: { contains: q, mode: "insensitive" } }, { email: { contains: q.toLowerCase() } }] } } },
          ],
        }
      : {}),
  };
  const [total, rows, counts] = await Promise.all([
    db.esignDocument.count({ where }),
    db.esignDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        createdAt: true,
        sentAt: true,
        completedAt: true,
        createdByName: true,
        signers: { select: { status: true, name: true, signedName: true }, orderBy: { order: "asc" } },
      },
    }),
    db.esignDocument.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<EsignDocumentStatus, number>>;
  return { total, rows, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)), byStatus };
}

export async function getDocument(id: string) {
  const doc = await db.esignDocument.findUnique({
    where: { id },
    include: {
      signers: { orderBy: { order: "asc" } },
      fields: { orderBy: { createdAt: "asc" } },
      events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!doc) throw new EsignError("not_found", "Documento não encontrado.");
  return doc;
}

function assertDraft(status: EsignDocumentStatus) {
  if (status !== "draft") {
    throw new EsignError("immutable", "Este documento já foi enviado e não pode mais ser editado.");
  }
}

/**
 * Salva o rascunho de uma vez (título, opções, signatários e campos). Os
 * signatários do editor chegam com uma `key` local; devolvemos key → id.
 */
export async function saveDraft(id: string, raw: DraftInput) {
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) throw new EsignError("invalid_input", parsed.error.issues[0]?.message ?? "Dados inválidos");
  const input = parsed.data;

  return db.$transaction(async (tx) => {
    await lockDocument(tx, id);
    const doc = await tx.esignDocument.findUnique({ where: { id }, select: { status: true, pageCount: true } });
    if (!doc) throw new EsignError("not_found", "Documento não encontrado.");
    assertDraft(doc.status);

    const keys = new Set(input.signers.map((s) => s.key));
    for (const f of input.fields) {
      if (!keys.has(f.signerKey)) throw new EsignError("invalid_input", "Campo sem signatário.");
      if (f.page >= doc.pageCount) throw new EsignError("invalid_input", "Campo em página inexistente.");
    }

    await tx.esignDocument.update({
      where: { id },
      data: { title: input.title, requireOtp: input.requireOtp, message: input.message ?? null },
    });

    const existing = await tx.esignSigner.findMany({ where: { documentId: id }, select: { id: true } });
    const existingIds = new Set(existing.map((s) => s.id));
    const keepIds = new Set(input.signers.map((s) => s.id).filter((v): v is string => !!v && existingIds.has(v)));
    await tx.esignField.deleteMany({ where: { documentId: id } });
    await tx.esignSigner.deleteMany({ where: { documentId: id, id: { notIn: [...keepIds] } } });

    const keyToId = new Map<string, string>();
    for (const [order, s] of input.signers.entries()) {
      const data = { order, name: s.name ?? null, email: s.email ?? null, cpf: s.cpf ?? null };
      if (s.id && keepIds.has(s.id)) {
        await tx.esignSigner.update({ where: { id: s.id }, data });
        keyToId.set(s.key, s.id);
      } else {
        const created = await tx.esignSigner.create({ data: { documentId: id, ...data } });
        keyToId.set(s.key, created.id);
      }
    }

    if (input.fields.length) {
      await tx.esignField.createMany({
        data: input.fields.map((f) => ({
          documentId: id,
          signerId: keyToId.get(f.signerKey)!,
          kind: f.kind,
          page: f.page,
          x: f.x,
          y: f.y,
          w: f.w,
          h: f.h,
        })),
      });
    }
    return { signers: [...keyToId.entries()].map(([key, signerId]) => ({ key, id: signerId })) };
  });
}

async function sendInvite(
  doc: { id: string; title: string; message: string | null; createdByName: string },
  signer: { id: string; name: string | null; email: string | null },
  token: string,
  ctx: EsignContext,
) {
  if (!signer.email) return { sent: false as const, reason: "no_email" };
  const mail = inviteEmail({
    name: signer.name,
    title: doc.title,
    url: signerLink(token),
    sender: doc.createdByName,
    message: doc.message,
  });
  const res = await sendEmail({ to: signer.email, ...mail });
  await recordEvent({
    documentId: doc.id,
    signerId: signer.id,
    type: "email_sent",
    ctx,
    data: { to: maskEmail(signer.email), ok: res.ok, skipped: res.skipped ?? false },
  });
  return { sent: res.ok, skipped: res.skipped ?? false };
}

/** Envia o documento: gera o link de cada signatário e (opcional) manda e-mails. */
export async function sendDocument(id: string, opts: { sendEmails: boolean }, ctx: EsignContext) {
  const { doc, links } = await db.$transaction(async (tx) => {
    await lockDocument(tx, id);
    const doc = await tx.esignDocument.findUnique({
      where: { id },
      include: { signers: { orderBy: { order: "asc" }, include: { fields: true } } },
    });
    if (!doc) throw new EsignError("not_found", "Documento não encontrado.");
    assertDraft(doc.status);
    if (doc.signers.length === 0) throw new EsignError("invalid_input", "Adicione pelo menos um signatário.");
    doc.signers.forEach((s, i) => {
      if (!s.fields.some((f) => f.kind === "signature")) {
        throw new EsignError(
          "invalid_input",
          `Posicione o campo de assinatura de ${s.name || `Signatário ${i + 1}`} no documento.`,
        );
      }
    });

    const links: { signerId: string; name: string | null; email: string | null; token: string }[] = [];
    for (const s of doc.signers) {
      const token = newToken();
      await tx.esignSigner.update({
        where: { id: s.id },
        data: { tokenHash: tokenHash(token), tokenEnc: encrypt(token) },
      });
      links.push({ signerId: s.id, name: s.name, email: s.email, token });
    }
    await tx.esignDocument.update({ where: { id }, data: { status: "pending", sentAt: new Date() } });
    await appendEvent(tx, {
      documentId: id,
      type: "sent",
      ctx,
      data: {
        by: ctx.actor?.name ?? "api",
        signers: doc.signers.map((s, i) => s.name || `Signatário ${i + 1}`),
        fields: doc.signers.reduce((n, s) => n + s.fields.length, 0),
      },
    });
    return { doc, links };
  });

  const emails: Record<string, { sent: boolean; skipped?: boolean }> = {};
  if (opts.sendEmails) {
    for (const l of links) {
      if (l.email) emails[l.signerId] = await sendInvite(doc, { id: l.signerId, name: l.name, email: l.email }, l.token, ctx);
    }
  }
  return {
    links: links.map((l) => ({
      signerId: l.signerId,
      name: l.name,
      email: l.email,
      link: signerLink(l.token),
      emailStatus: emails[l.signerId] ?? null,
    })),
  };
}

async function pendingSigner(signerId: string) {
  const s = await db.esignSigner.findUnique({
    where: { id: signerId },
    include: { document: { select: { id: true, status: true, title: true, message: true, createdByName: true } } },
  });
  if (!s) throw new EsignError("not_found", "Signatário não encontrado.");
  return s;
}

/** Link atual do signatário (descriptografado) — para o operador copiar. */
export async function getSignerLink(signerId: string): Promise<string> {
  const s = await pendingSigner(signerId);
  if (!s.tokenEnc) throw new EsignError("not_available", "O documento ainda não foi enviado.");
  return signerLink(decrypt(s.tokenEnc));
}

/** Gera um link novo (o anterior para de funcionar). */
export async function rotateSignerLink(signerId: string, ctx: EsignContext): Promise<string> {
  const s = await pendingSigner(signerId);
  if (s.document.status !== "pending" || s.status !== "pending") {
    throw new EsignError("not_available", "Só é possível gerar um novo link para quem ainda não assinou.");
  }
  const token = newToken();
  await db.$transaction(async (tx) => {
    await lockDocument(tx, s.documentId);
    await tx.esignSigner.update({ where: { id: s.id }, data: { tokenHash: tokenHash(token), tokenEnc: encrypt(token) } });
    await appendEvent(tx, { documentId: s.documentId, signerId: s.id, type: "link_rotated", ctx, data: { by: ctx.actor?.name ?? "api" } });
  });
  return signerLink(token);
}

export async function resendInvite(signerId: string, ctx: EsignContext) {
  const s = await pendingSigner(signerId);
  if (s.document.status !== "pending" || s.status !== "pending") {
    throw new EsignError("not_available", "Este signatário não está aguardando assinatura.");
  }
  if (!s.email) throw new EsignError("invalid_input", "Este signatário não tem e-mail cadastrado.");
  if (!s.tokenEnc) throw new EsignError("not_available", "O documento ainda não foi enviado.");
  return sendInvite(s.document, s, decrypt(s.tokenEnc), ctx);
}

export async function cancelDocument(id: string, ctx: EsignContext) {
  await db.$transaction(async (tx) => {
    await lockDocument(tx, id);
    const doc = await tx.esignDocument.findUnique({ where: { id }, select: { status: true } });
    if (!doc) throw new EsignError("not_found", "Documento não encontrado.");
    if (doc.status === "completed") throw new EsignError("immutable", "Documentos concluídos não podem ser cancelados.");
    if (doc.status === "cancelled") return;
    await tx.esignDocument.update({ where: { id }, data: { status: "cancelled", cancelledAt: new Date() } });
    await appendEvent(tx, { documentId: id, type: "cancelled", ctx, data: { by: ctx.actor?.name ?? "api" } });
  });
}

/** Rascunhos podem ser apagados (não há evidência a preservar). */
export async function deleteDraft(id: string) {
  const doc = await db.esignDocument.findUnique({ where: { id }, select: { status: true, originalPath: true } });
  if (!doc) throw new EsignError("not_found", "Documento não encontrado.");
  assertDraft(doc.status);
  await db.esignDocument.delete({ where: { id } });
  await storage().remove([doc.originalPath]).catch(() => {});
}

/** Bytes do original ou do assinado (o chamador faz a autorização). */
export async function getDocumentFile(id: string, which: "original" | "signed") {
  const doc = await db.esignDocument.findUnique({
    where: { id },
    select: { originalPath: true, signedPath: true, originalName: true, code: true, title: true },
  });
  if (!doc) throw new EsignError("not_found", "Documento não encontrado.");
  const path = which === "signed" ? doc.signedPath : doc.originalPath;
  if (!path) throw new EsignError("not_found", "Ainda não há versão assinada deste documento.");
  const bytes = await storage().get(path);
  const base = doc.title.replace(/[^\p{L}\p{N} _.-]+/gu, "").trim().slice(0, 80) || doc.code;
  const fileName = which === "signed" ? `${base} - assinado.pdf` : `${base}.pdf`;
  return { bytes, fileName };
}

export type { PageBox };
