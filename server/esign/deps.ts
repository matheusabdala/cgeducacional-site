import "server-only";

/**
 * Fronteira do módulo de assinatura com o app hospedeiro (LMS).
 * É o ÚNICO arquivo de `server/esign` que importa coisas de fora do módulo —
 * para extrair o módulo para um produto próprio, basta reimplementar este
 * arquivo (banco, env, URL pública, e-mail, storage).
 */

export { prisma as db } from "@/lib/prisma";
export { siteUrl as publicBaseUrl } from "@/lib/site";
export { sendEmail } from "@/server/email";
export { createAdminClient as storageClient } from "@/lib/supabase/admin";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { serverEnv } from "@/lib/env";

/** E-mail de quem criou o documento (operador do LMS), para avisos. */
export async function actorEmail(actorId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");
  const u = await prisma.user.findUnique({ where: { id: actorId }, select: { email: true } });
  return u?.email ?? null;
}

let logoCache: Uint8Array | null | undefined;
/** Logo oficial (PNG) para o relatório de assinaturas. null se não achar. */
export async function logoPng(): Promise<Uint8Array | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = await readFile(path.join(process.cwd(), "public", "brand", "logo.png"));
  } catch {
    logoCache = null;
  }
  return logoCache;
}

export const env = {
  secret: () => serverEnv.esignSecret(),
  apiKey: () => serverEnv.esignApiKey(),
  bucket: () => serverEnv.esignStorageBucket(),
  certP12Base64: () => serverEnv.esignCertP12Base64(),
  certPassword: () => serverEnv.esignCertPassword(),
};
