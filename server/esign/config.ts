/** Parâmetros do módulo de assinatura (sem dependências do app). */

export const ESIGN = {
  maxPdfBytes: 25 * 1024 * 1024,
  maxSignatureBytes: 1024 * 1024,
  otpTtlMs: 10 * 60_000,
  otpMaxAttempts: 5,
  otpMaxSends: 3,
  otpSendWindowMs: 15 * 60_000,
  /** OTP verificado vale para assinar por este tempo. */
  otpValidForMs: 60 * 60_000,
  sessionTtlMs: 10 * 60_000,
  /** Assinatura recebida pelo celular pode ser usada até este tempo depois. */
  phoneSignatureUseMs: 30 * 60_000,
  urlFetchTimeoutMs: 20_000,
  urlFetchMaxRedirects: 3,
  timeZone: "America/Campo_Grande",
  company: {
    name: "CG Educacional",
    cnpj: "53.123.217/0001-55",
    site: "cgeducacional.com.br",
  },
} as const;

export const PDF_MIME = "application/pdf";

/** Tipos que no futuro serão convertidos para PDF (Gotenberg). Hoje: recusados. */
export const CONVERTIBLE_MIMES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const CONVERTIBLE_EXT = /\.(docx?|odt|rtf)$/i;

export const WORD_NOT_SUPPORTED =
  "Arquivos do Word ainda não são aceitos. Converta para PDF antes de enviar (Word chega em breve).";

/** Texto de consentimento exibido e registrado em cada assinatura. */
export const CONSENT_TEXT =
  "Declaro que li o documento, concordo com o seu conteúdo e aceito assiná-lo eletronicamente. " +
  "Reconheço esta assinatura eletrônica como válida e equivalente à assinatura de próprio punho, " +
  "nos termos do art. 10, § 2º, da MP 2.200-2/2001 e da Lei 14.063/2020.";

export const LEGAL_BASIS =
  "Documento assinado eletronicamente por meio de assinatura eletrônica avançada, admitida pelas partes " +
  "como válida nos termos do art. 10, § 2º, da Medida Provisória 2.200-2/2001 e do art. 4º, II, da Lei " +
  "14.063/2020. A integridade pode ser conferida pelo hash SHA-256 e pelo código de validação.";
