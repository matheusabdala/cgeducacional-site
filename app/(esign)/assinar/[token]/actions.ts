"use server";

import QRCode from "qrcode";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import type { IdentifyInput, SignatureSubmitInput } from "@/lib/validations/esign";
import {
  createSignatureSession,
  errorMessage,
  getSignatureSessionStatus,
  identify,
  requestOtp,
  signerForToken,
  submitSignature,
  verifyOtp,
} from "@/server/esign";

/** Ações públicas (sem login): autorizadas pelo token do link + rate limit por IP. */
async function guard(bucket: string, limit: number, windowMs: number) {
  const meta = await requestMeta();
  const rl = rateLimit(`esign:${bucket}:${meta.ip ?? "?"}`, limit, windowMs);
  if (!rl.ok) return { meta, error: "Muitas tentativas. Aguarde um pouco e tente de novo." };
  return { meta, error: null as string | null };
}

export async function identifyAction(
  token: string,
  input: IdentifyInput,
): Promise<{ needsOtp?: boolean; sentTo?: string; devMode?: boolean; error?: string }> {
  const g = await guard("identify", 30, 10 * 60_000);
  if (g.error) return { error: g.error };
  try {
    return await identify(token, input, g.meta);
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function requestOtpAction(
  token: string,
  email: string,
): Promise<{ sentTo?: string; devMode?: boolean; error?: string }> {
  const g = await guard("otp-send", 10, 60 * 60_000);
  if (g.error) return { error: g.error };
  try {
    return await requestOtp(token, String(email ?? "").trim().toLowerCase(), g.meta);
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function verifyOtpAction(token: string, code: string): Promise<{ ok?: true; error?: string }> {
  const g = await guard("otp-verify", 25, 10 * 60_000);
  if (g.error) return { error: g.error };
  try {
    return await verifyOtp(token, code, g.meta);
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function createPhoneSignatureAction(
  token: string,
): Promise<{ code?: string; url?: string; qr?: string; expiresAt?: string; error?: string }> {
  const g = await guard("phone-session", 15, 10 * 60_000);
  if (g.error) return { error: g.error };
  try {
    const signer = await signerForToken(token);
    const s = await createSignatureSession(signer, g.meta);
    const qr = await QRCode.toDataURL(s.url, { margin: 1, width: 360, errorCorrectionLevel: "M" });
    return { code: s.code, url: s.url, qr, expiresAt: s.expiresAt.toISOString() };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function phoneSignatureStatusAction(
  token: string,
  code: string,
): Promise<{ status?: "waiting" | "received" | "expired"; dataUrl?: string; device?: string | null; error?: string }> {
  try {
    const signer = await signerForToken(token);
    return await getSignatureSessionStatus(code, signer.id);
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function submitSignatureAction(
  token: string,
  input: SignatureSubmitInput,
): Promise<{ ok?: true; completed?: boolean; error?: string }> {
  const g = await guard("submit", 20, 10 * 60_000);
  if (g.error) return { error: g.error };
  try {
    const res = await submitSignature(token, input, g.meta);
    return { ok: true, completed: res.completed };
  } catch (e) {
    return { error: errorMessage(e, "Não foi possível registrar a assinatura. Tente novamente.") };
  }
}
