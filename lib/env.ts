/**
 * Acesso centralizado e tipado às variáveis de ambiente.
 * Variáveis públicas usam prefixo NEXT_PUBLIC_ (expostas ao browser).
 * As demais são server-only — nunca importe `serverEnv` em Client Components.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  // Public key do Mercado Pago — publicável por design (usada pelo SDK no browser
  // p/ tokenizar o cartão). Vazia até configurar; o checkout avisa se faltar.
  mercadopagoPublicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "",
};

/** Use apenas no servidor (Server Components, Actions, Route Handlers). */
export const serverEnv = {
  supabaseServiceRoleKey: () =>
    required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  databaseUrl: () => required("DATABASE_URL", process.env.DATABASE_URL),
  googleServiceAccountEmail: () =>
    required(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    ),
  googlePrivateKey: () =>
    required("GOOGLE_PRIVATE_KEY", process.env.GOOGLE_PRIVATE_KEY).replace(
      /\\n/g,
      "\n",
    ),
  googleDriveFolderId: () =>
    required("GOOGLE_DRIVE_FOLDER_ID", process.env.GOOGLE_DRIVE_FOLDER_ID),
  certimakerApiUrl: () =>
    required("CERTIMAKER_API_URL", process.env.CERTIMAKER_API_URL).replace(
      /\/$/,
      "",
    ),
  certimakerApiKey: () =>
    required("CERTIMAKER_API_KEY", process.env.CERTIMAKER_API_KEY),
  // --- Mercado Pago ---
  mercadopagoAccessToken: () =>
    required("MERCADOPAGO_ACCESS_TOKEN", process.env.MERCADOPAGO_ACCESS_TOKEN),
  /** Segredo da assinatura do webhook (configurado no painel do MP). Opcional. */
  mercadopagoWebhookSecret: () => process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
  /** Desconto do PIX em % (editável via env). Default 2%. */
  pixDiscountPct: () => {
    const v = Number(process.env.MERCADOPAGO_PIX_DISCOUNT ?? "2");
    return Number.isFinite(v) && v >= 0 && v <= 90 ? v : 2;
  },
};
