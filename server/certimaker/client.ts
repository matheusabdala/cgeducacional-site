import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Cliente do Certimaker (https://certimaker.cgeducacional.com.br) via API key
 * (Authorization: Bearer). Cobre o fluxo de emissão: aluno → curso → turma →
 * modelo → certificado. Ver /docs do Certimaker.
 */

export class CertimakerError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CertimakerError";
    this.status = status;
  }
}

export class InsufficientCreditsError extends CertimakerError {
  constructor() {
    super("Sem créditos no Certimaker para emitir o certificado.", 402);
    this.name = "InsufficientCreditsError";
  }
}

async function cmFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = serverEnv.certimakerApiUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverEnv.certimakerApiKey()}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    // 307 (sessão ausente / token inválido) vira erro em vez de seguir p/ /login.
    redirect: "manual",
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (res.status === 402) throw new InsufficientCreditsError();
  if (res.status >= 300) {
    const msg =
      (json as { error?: string })?.error ??
      (res.status === 307 || res.status === 401
        ? "Falha de autenticação no Certimaker (verifique a API key)."
        : `Certimaker respondeu ${res.status}`);
    throw new CertimakerError(msg, res.status);
  }
  return json as T;
}

// --- Tipos mínimos das respostas ---------------------------------------

interface CmId {
  id: string;
}
interface CmTemplate {
  id: string;
  name: string;
  isPreset?: boolean;
}

export interface CmValidation {
  id: string;
  alunoNome: string;
  alunoCpf: string;
  cursoNome: string;
  cargaHoraria: number;
  professor?: string;
  dataInicio?: string;
  dataFim?: string;
  dataEmissao?: string;
  valid: boolean;
}

export const certimaker = {
  async createAluno(input: {
    nome: string;
    email: string;
    cpf: string;
    modalidade: "presencial" | "online" | "hibrido";
  }): Promise<string> {
    const aluno = await cmFetch<CmId>("/api/alunos", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return aluno.id;
  },

  /** Busca aluno por CPF (para reaproveitar quando já existe / 409). */
  async findAlunoIdByCpf(cpf: string): Promise<string | null> {
    const res = await cmFetch<{ data: { id: string; cpf: string }[] }>(
      `/api/alunos?search=${encodeURIComponent(cpf)}&limit=5`,
    );
    const found = res.data?.find((a) => a.cpf.replace(/\D/g, "") === cpf);
    return found?.id ?? res.data?.[0]?.id ?? null;
  },

  async createCurso(input: {
    nome: string;
    cargaHoraria: number;
    modalidade: "presencial" | "online";
    professor?: string;
    conteudoProgramatico?: string;
  }): Promise<string> {
    const curso = await cmFetch<CmId>("/api/cursos", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return curso.id;
  },

  async createTurma(input: {
    cursoId: string;
    dataInicio: string;
    dataFim: string;
  }): Promise<string> {
    const turma = await cmFetch<CmId>("/api/turmas", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return turma.id;
  },

  /** templateId padrão: o primeiro preset disponível (ou o primeiro modelo). */
  async defaultTemplateId(): Promise<string> {
    const res = await cmFetch<{ data: CmTemplate[] }>("/api/modelos");
    const presets = res.data?.filter((t) => t.isPreset);
    const chosen = presets?.[0] ?? res.data?.[0];
    if (!chosen) throw new CertimakerError("Nenhum modelo disponível", 404);
    return chosen.id;
  },

  async issueCertificate(input: {
    alunoId: string;
    turmaId: string;
    templateId: string;
  }): Promise<{ code: string }> {
    const cert = await cmFetch<CmId>("/api/certificados", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { code: cert.id };
  },

  /** Validação pública de certificado (por código ou CPF). */
  async validate(input: {
    code?: string;
    cpf?: string;
  }): Promise<{ results: CmValidation[]; total: number }> {
    const q = input.code
      ? `code=${encodeURIComponent(input.code)}`
      : `cpf=${encodeURIComponent(input.cpf ?? "")}`;
    return cmFetch<{ results: CmValidation[]; total: number }>(
      `/api/validar?${q}`,
    );
  },

  pdfUrl(code: string, inline = false): string {
    const base = serverEnv.certimakerApiUrl();
    return `${base}/api/certificados/${code}/pdf${inline ? "?inline=1" : ""}`;
  },

  /**
   * Busca o PDF autenticado (o endpoint /pdf exige o Bearer em produção). O LMS
   * usa isto para servir o PDF aos alunos via proxy (eles não logam no Certimaker).
   */
  async fetchPdf(code: string): Promise<Response> {
    const res = await fetch(this.pdfUrl(code), {
      headers: { Authorization: `Bearer ${serverEnv.certimakerApiKey()}` },
      cache: "no-store",
      redirect: "manual",
    });
    if (res.status >= 300 || !res.body) {
      throw new CertimakerError("PDF do certificado indisponível", res.status);
    }
    return res;
  },
};
