"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { requestMeta } from "@/lib/request-meta";
import { rateLimit } from "@/lib/rate-limit";
import type { DraftInput } from "@/lib/validations/esign";
import {
  cancelDocument,
  createDocument,
  createUploadSession,
  deleteDraft,
  errorMessage,
  fetchPdfFromUrl,
  getSignerLink,
  getUploadSessionStatus,
  resendInvite,
  rotateSignerLink,
  saveDraft,
  sendDocument,
  type EsignContext,
} from "@/server/esign";

/** Todas as ações do módulo são só de administrador. */
async function adminCtx(): Promise<EsignContext & { actor: { id: string; name: string } }> {
  const profile = await requireRole(["admin"], "/admin/documentos");
  const meta = await requestMeta();
  return { actor: { id: profile.id, name: profile.name }, ...meta };
}

const idSchema = z.string().min(1).max(64);

function revalidate(id?: string) {
  revalidatePath("/admin/documentos");
  if (id) revalidatePath(`/admin/documentos/${id}`);
}

export async function saveDraftAction(
  id: string,
  draft: DraftInput,
): Promise<{ ok?: true; signers?: { key: string; id: string }[]; error?: string }> {
  await adminCtx();
  if (!idSchema.safeParse(id).success) return { error: "Documento inválido" };
  try {
    const res = await saveDraft(id, draft);
    return { ok: true, signers: res.signers };
  } catch (e) {
    return { error: errorMessage(e, "Não foi possível salvar o rascunho.") };
  }
}

export async function sendDocumentAction(
  id: string,
  opts: { sendEmails: boolean },
): Promise<{ ok?: true; emailed?: number; error?: string }> {
  const ctx = await adminCtx();
  try {
    const res = await sendDocument(id, { sendEmails: Boolean(opts?.sendEmails) }, ctx);
    revalidate(id);
    return { ok: true, emailed: res.links.filter((l) => l.emailStatus?.sent).length };
  } catch (e) {
    return { error: errorMessage(e, "Não foi possível enviar o documento.") };
  }
}

export async function createFromUrlAction(
  url: string,
): Promise<{ ok?: true; id?: string; error?: string }> {
  const ctx = await adminCtx();
  const rl = rateLimit(`esign:url:${ctx.actor.id}`, 20, 10 * 60_000);
  if (!rl.ok) return { error: "Muitas importações seguidas. Aguarde alguns minutos." };
  if (!z.string().url().safeParse(url?.trim()).success) return { error: "Cole um link válido (https://…)." };
  try {
    const file = await fetchPdfFromUrl(url);
    const doc = await createDocument({ ...file, source: "link" }, ctx);
    revalidate();
    return { ok: true, id: doc.id };
  } catch (e) {
    return { error: errorMessage(e, "Não foi possível importar o arquivo desse link.") };
  }
}

export async function createPhoneUploadAction(): Promise<{
  code?: string;
  url?: string;
  qr?: string;
  expiresAt?: string;
  error?: string;
}> {
  const ctx = await adminCtx();
  try {
    const s = await createUploadSession(ctx.actor);
    const qr = await QRCode.toDataURL(s.url, { margin: 1, width: 360, errorCorrectionLevel: "M" });
    return { code: s.code, url: s.url, qr, expiresAt: s.expiresAt.toISOString() };
  } catch (e) {
    return { error: errorMessage(e, "Não foi possível gerar o QR code.") };
  }
}

export async function phoneUploadStatusAction(
  code: string,
): Promise<{ status?: "waiting" | "received" | "expired"; documentId?: string | null; error?: string }> {
  const ctx = await adminCtx();
  try {
    return await getUploadSessionStatus(code, ctx.actor.id);
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function getSignerLinkAction(signerId: string): Promise<{ link?: string; error?: string }> {
  await adminCtx();
  try {
    return { link: await getSignerLink(signerId) };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function rotateSignerLinkAction(
  signerId: string,
  documentId: string,
): Promise<{ link?: string; error?: string }> {
  const ctx = await adminCtx();
  try {
    const link = await rotateSignerLink(signerId, ctx);
    revalidate(documentId);
    return { link };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function resendInviteAction(
  signerId: string,
  documentId: string,
): Promise<{ ok?: true; skipped?: boolean; error?: string }> {
  const ctx = await adminCtx();
  try {
    const res = await resendInvite(signerId, ctx);
    revalidate(documentId);
    if (res.sent) return { ok: true };
    if ("skipped" in res && res.skipped) return { ok: true, skipped: true };
    return { error: "Não foi possível enviar o e-mail." };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function cancelDocumentAction(id: string): Promise<{ ok?: true; error?: string }> {
  const ctx = await adminCtx();
  try {
    await cancelDocument(id, ctx);
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function deleteDraftAction(id: string): Promise<{ ok?: true; error?: string }> {
  await adminCtx();
  try {
    await deleteDraft(id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
