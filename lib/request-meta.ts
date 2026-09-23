import "server-only";
import { headers } from "next/headers";

/**
 * IP e user-agent da requisição atual (evidência de assinatura / auditoria).
 * Atrás do proxy do Coolify (Traefik), o IP real vem no X-Forwarded-For.
 */
export function metaFromHeaders(h: Headers): { ip: string | null; userAgent: string | null } {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;
  return { ip, userAgent };
}

export async function requestMeta() {
  return metaFromHeaders(await headers());
}
