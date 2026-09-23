"use server";

import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { errorMessage, submitPhoneSignature } from "@/server/esign";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Página do celular (QR): envia a assinatura desenhada com o dedo. */
export async function submitPhoneSignatureAction(code: string, pngBase64: string): Promise<{ ok?: true; error?: string }> {
  const meta = await requestMeta();
  if (!rateLimit(`esign:phone-sign:${meta.ip ?? "?"}`, 20, 10 * 60_000).ok) {
    return { error: "Muitas tentativas. Aguarde um pouco." };
  }
  const buf = Buffer.from(String(pngBase64 ?? "").replace(/^data:image\/png;base64,/, ""), "base64");
  if (buf.length < 100 || buf.length > 1024 * 1024 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    return { error: "Assinatura inválida. Desenhe novamente." };
  }
  try {
    await submitPhoneSignature(code, buf, meta);
    return { ok: true };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
