"use server";

import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { validateByCode } from "@/server/esign";

export type DocumentValidation = NonNullable<Awaited<ReturnType<typeof validateByCode>>>;

/** Consulta pública de autenticidade por código (ex.: DOC-7K3M-Q2ZP). */
export async function validateDocumentAction(code: string): Promise<{ result?: DocumentValidation; error?: string }> {
  const { ip } = await requestMeta();
  if (!rateLimit(`esign:validate:${ip ?? "?"}`, 30, 60_000).ok) {
    return { error: "Muitas consultas seguidas. Aguarde um instante." };
  }
  const result = await validateByCode(String(code ?? ""));
  if (!result) return { error: "Nenhum documento encontrado com esse código." };
  return { result: JSON.parse(JSON.stringify(result)) };
}
