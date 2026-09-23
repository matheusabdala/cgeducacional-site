/**
 * Erro tipado do módulo. As Server Actions convertem em `{ error: message }`;
 * a REST v1 converte em status HTTP + `{ error, code }`.
 */
export type EsignErrorCode =
  | "not_found"
  | "invalid_input"
  | "invalid_token"
  | "not_available"
  | "immutable"
  | "unsupported_type"
  | "too_large"
  | "encrypted_pdf"
  | "invalid_pdf"
  | "cpf_mismatch"
  | "otp_required"
  | "otp_invalid"
  | "otp_expired"
  | "otp_locked"
  | "rate_limited"
  | "session_expired"
  | "fetch_failed"
  | "forbidden_url"
  | "storage"
  | "email"
  | "unauthorized";

const STATUS: Record<EsignErrorCode, number> = {
  not_found: 404,
  invalid_input: 400,
  invalid_token: 404,
  not_available: 410,
  immutable: 409,
  unsupported_type: 415,
  too_large: 413,
  encrypted_pdf: 422,
  invalid_pdf: 422,
  cpf_mismatch: 422,
  otp_required: 401,
  otp_invalid: 422,
  otp_expired: 422,
  otp_locked: 429,
  rate_limited: 429,
  session_expired: 410,
  fetch_failed: 502,
  forbidden_url: 400,
  storage: 502,
  email: 502,
  unauthorized: 401,
};

export class EsignError extends Error {
  readonly code: EsignErrorCode;
  readonly status: number;
  constructor(code: EsignErrorCode, message: string) {
    super(message);
    this.name = "EsignError";
    this.code = code;
    this.status = STATUS[code];
  }
}

/** Mensagem amigável para qualquer erro (o que não for EsignError vira genérico). */
export function errorMessage(e: unknown, fallback = "Não foi possível concluir. Tente novamente."): string {
  if (e instanceof EsignError) return e.message;
  console.error("[esign]", e);
  return fallback;
}
