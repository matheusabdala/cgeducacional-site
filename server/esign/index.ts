/**
 * Módulo de assinatura eletrônica — fachada pública.
 * UI (Server Actions), REST v1 e páginas públicas importam SÓ daqui.
 * Ver docs/esign.md (arquitetura e como extrair para um produto próprio).
 */
export * from "./documents";
export * from "./signers";
export * from "./sessions";
export * from "./validation";
export { verifyAuditChain } from "./evidence";
export { fetchPdfFromUrl } from "./fetch-url";
export { assertApiKey } from "./api-auth";
export { EsignError, errorMessage } from "./errors";
export { ESIGN, CONSENT_TEXT, WORD_NOT_SUPPORTED } from "./config";
export { maskCpf, maskEmail, formatDateTime, describeDevice, METHOD_LABEL } from "./format";
export { sealEnabled } from "./pdf/seal";
export type { EsignContext, FieldKind, FieldRect, PageBox, Geo } from "./types";
