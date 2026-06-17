"use server";

import { z } from "zod";
import {
  certimaker,
  CertimakerError,
  type CmValidation,
} from "@/server/certimaker/client";
import { cleanCpf } from "@/lib/cpf";

const schema = z.object({
  type: z.enum(["code", "cpf"]),
  value: z.string().min(1),
});

/** Valida um certificado (público) consultando o Certimaker. */
export async function validateCertificate(
  input: unknown,
): Promise<{ results?: CmValidation[]; error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Informe o código ou CPF." };
  const { type, value } = parsed.data;

  try {
    const res =
      type === "code"
        ? await certimaker.validate({ code: value.trim().toUpperCase() })
        : await certimaker.validate({ cpf: cleanCpf(value) });
    return { results: res.results ?? [] };
  } catch (e) {
    if (e instanceof CertimakerError) {
      return { error: "Não foi possível validar agora. Tente novamente." };
    }
    return { error: "Falha ao validar o certificado." };
  }
}
