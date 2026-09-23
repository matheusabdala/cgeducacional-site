import "server-only";
import { env } from "../deps";

/**
 * Gancho para o selo ICP-Brasil (PAdES) com o e-CNPJ A1 da CG.
 * Hoje é um no-op: só passa a atuar quando ESIGN_CERT_P12_BASE64 e
 * ESIGN_CERT_PASSWORD estiverem configurados E a implementação com
 * `@signpdf/signpdf` + `@signpdf/signer-p12` for adicionada aqui.
 */
export function sealEnabled(): boolean {
  return Boolean(env.certP12Base64() && env.certPassword());
}

export async function sealWithCertificate(pdf: Uint8Array): Promise<Uint8Array> {
  if (!sealEnabled()) return pdf;
  // TODO(selo A1): plainAddPlaceholder + P12Signer(Buffer.from(p12, "base64"), { passphrase }).
  console.warn("[esign] Certificado configurado, mas o selo ICP-Brasil ainda não foi implementado.");
  return pdf;
}
