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
};
