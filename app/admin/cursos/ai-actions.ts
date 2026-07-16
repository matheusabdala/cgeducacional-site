"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { gemini, GeminiError } from "@/server/gemini/client";

const CATEGORIES = ["neurociencia", "pedagogia", "gestao", "inclusao"] as const;
const LEVELS = ["iniciante", "intermediario", "avancado"] as const;

/** Rascunho de curso sugerido pela IA (todos os campos são opcionais no uso). */
export type CourseDraft = {
  title: string;
  description: string;
  fullDescription: string;
  programContent: string;
  workloadHours?: number;
  level?: (typeof LEVELS)[number];
  category?: (typeof CATEGORIES)[number];
};

type DraftResult = { ok?: true; draft?: CourseDraft; error?: string };

// Schema que a IA deve respeitar (structured output do Gemini).
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    fullDescription: { type: "string" },
    programContent: { type: "string" },
    workloadHours: { type: "integer" },
    level: { type: "string", enum: [...LEVELS] },
    category: { type: "string", enum: [...CATEGORIES] },
  },
  required: [
    "title",
    "description",
    "fullDescription",
    "programContent",
    "workloadHours",
    "level",
    "category",
  ],
} as const;

// Validação/saneamento da resposta (a IA às vezes foge do enum).
const draftSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().default(""),
  fullDescription: z.string().trim().default(""),
  programContent: z.string().trim().default(""),
  workloadHours: z.number().int().min(0).max(10000).optional().catch(undefined),
  level: z.enum(LEVELS).optional().catch(undefined),
  category: z.enum(CATEGORIES).optional().catch(undefined),
});

const hintsSchema = z
  .string()
  .trim()
  .min(3, "Escreva ao menos algumas palavras sobre o curso.")
  .max(4000, "Texto muito longo.");

const SYSTEM =
  "Você é especialista em design instrucional da CG Educacional, instituição " +
  "brasileira de ensino (neurociência, educação inclusiva, formação de " +
  "professores, EJA). Você cria rascunhos de cursos claros e profissionais em " +
  "português do Brasil.";

/**
 * Gera um rascunho de curso a partir de dicas livres do operador (nome do curso,
 * tópicos, público-alvo…). Retorna sugestões para os campos do cadastro.
 */
export async function generateCourseDraft(hints: unknown): Promise<DraftResult> {
  await requireRole(["admin", "instructor"], "/admin");

  const parsedHints = hintsSchema.safeParse(hints);
  if (!parsedHints.success) {
    return { error: parsedHints.error.issues[0]?.message ?? "Dicas inválidas" };
  }

  const prompt = [
    "Com base nas dicas do operador abaixo, gere um rascunho de curso.",
    "",
    "Dicas do operador:",
    `"""${parsedHints.data}"""`,
    "",
    "Regras de cada campo:",
    "- title: nome do curso, claro e atraente (até ~70 caracteres).",
    "- description: resumo de 1 a 2 frases para o card do curso.",
    "- fullDescription: descrição completa (público-alvo, objetivos e o que o aluno aprende), 1 a 3 parágrafos.",
    "- programContent: conteúdo programático em tópicos, UM POR LINHA, cada linha começando com \"• \". Este texto vai no certificado.",
    "- workloadHours: carga horária estimada em horas (número inteiro).",
    `- level: um de: ${LEVELS.join(", ")}.`,
    `- category: a mais adequada entre: ${CATEGORIES.join(", ")} (gestao = gestão escolar, inclusao = educação inclusiva).`,
    "",
    "Responda somente com o JSON.",
  ].join("\n");

  try {
    const raw = await gemini.generateJSON<unknown>({
      system: SYSTEM,
      prompt,
      schema: RESPONSE_SCHEMA,
      temperature: 0.8,
    });
    const parsed = draftSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "A IA retornou dados fora do formato esperado. Tente de novo." };
    }
    return { ok: true, draft: parsed.data };
  } catch (e) {
    if (e instanceof GeminiError) return { error: e.message };
    return {
      error: e instanceof Error ? e.message : "Falha ao gerar o rascunho.",
    };
  }
}
