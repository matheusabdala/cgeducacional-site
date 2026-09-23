import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "./deps";
import { EsignError } from "./errors";

/** Autenticação da REST v1: `Authorization: Bearer <ESIGN_API_KEY>`. */
export function assertApiKey(authorization: string | null) {
  const expected = env.apiKey();
  if (!expected) throw new EsignError("not_available", "API de assinatura desativada (ESIGN_API_KEY não configurada).");
  const got = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new EsignError("unauthorized", "API key inválida.");
  }
}
