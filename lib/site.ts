/**
 * URL pública do site, para montar links em e-mails e contextos sem request
 * (server-side). Em runtime no Coolify, `NEXT_PUBLIC_SITE_URL` aponta para o
 * domínio de produção; em dev cai no localhost.
 */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cgeducacional.com.br"
  ).replace(/\/$/, "");
}
