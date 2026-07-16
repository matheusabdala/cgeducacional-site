import { serverEnv } from "@/lib/env";

/**
 * Cliente fino para a API do Gemini (generativelanguage.googleapis.com).
 * Server-only: só importe em Server Actions / Route Handlers.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.5-flash";

export class GeminiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

type JsonSchema = Record<string, unknown>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extrai a mensagem de erro do corpo JSON da API (quando houver). */
function parseApiError(body: string): string | null {
  try {
    const j = JSON.parse(body) as { error?: { message?: string } };
    return j.error?.message ?? null;
  } catch {
    return null;
  }
}

export const gemini = {
  /**
   * Gera uma resposta JSON validada por `schema` (structured output do Gemini).
   * Faz retry em 503/429 (picos de demanda). Lança `GeminiError` em falha.
   */
  async generateJSON<T>(opts: {
    prompt: string;
    schema: JsonSchema;
    system?: string;
    temperature?: number;
  }): Promise<T> {
    const key = serverEnv.geminiApiKey();
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
      ...(opts.system
        ? { systemInstruction: { parts: [{ text: opts.system }] } }
        : {}),
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: opts.schema,
        temperature: opts.temperature ?? 0.7,
      },
    });

    let lastError: GeminiError | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${BASE}/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
      });

      // Sobrecarga temporária → espera e tenta de novo.
      if (res.status === 503 || res.status === 429) {
        lastError = new GeminiError(
          "A IA está sobrecarregada no momento. Tente novamente em instantes.",
          res.status,
        );
        await sleep(800 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new GeminiError(
          parseApiError(detail) ?? `Falha na IA (HTTP ${res.status})`,
          res.status,
        );
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new GeminiError("A IA retornou uma resposta vazia.");
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new GeminiError("A IA retornou um JSON inválido.");
      }
    }

    throw lastError ?? new GeminiError("Falha ao chamar a IA.");
  },
};
