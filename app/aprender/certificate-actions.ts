"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { cleanCpf, isValidCpf } from "@/lib/cpf";
import {
  certimaker,
  CertimakerError,
  InsufficientCreditsError,
} from "@/server/certimaker/client";
import { sendEmail } from "@/server/email";
import { certificateEmail } from "@/server/email/templates";

type IssueResult = {
  ok?: boolean;
  error?: string;
  needsCpf?: boolean;
  code?: string;
  pdfUrl?: string;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Emite (ou retorna) o certificado do aluno para um curso concluído.
 * Idempotente: se já existe, devolve o existente. Espelha aluno/curso/turma no
 * Certimaker (cacheando os ids) e emite via API key.
 */
export async function issueCertificate(courseId: string): Promise<IssueResult> {
  const authUser = await getAuthUser();
  if (!authUser) return { error: "Não autenticado" };

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      certimakerAlunoId: true,
    },
  });
  if (!user) return { error: "Usuário não encontrado" };
  if (!user.cpf) return { needsCpf: true, error: "Informe seu CPF para emitir o certificado." };

  // Já emitido? (idempotente)
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { code: true, certificateUrl: true },
  });
  if (existing?.code) {
    return {
      ok: true,
      code: existing.code,
      pdfUrl: existing.certificateUrl ?? certimaker.pdfUrl(existing.code),
    };
  }

  // Precisa estar matriculado e ter concluído o curso.
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { enrolledAt: true, completedAt: true },
  });
  if (!enrollment) return { error: "Você não está matriculado neste curso." };
  if (!enrollment.completedAt)
    return { error: "Conclua todas as aulas para emitir o certificado." };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      durationLabel: true,
      programContent: true,
      workloadHours: true,
      modality: true,
      location: true,
      startDate: true,
      endDate: true,
      certimakerCursoId: true,
      certimakerTurmaId: true,
      certimakerTemplateId: true,
      instructor: { select: { name: true } },
    },
  });
  if (!course) return { error: "Curso não encontrado" };

  try {
    // 1) Aluno
    let alunoId = user.certimakerAlunoId;
    if (!alunoId) {
      try {
        alunoId = await certimaker.createAluno({
          nome: user.name,
          email: user.email,
          cpf: user.cpf,
          modalidade: course.modality,
        });
      } catch (e) {
        // 409: CPF já existe no Certimaker → reaproveita.
        if (e instanceof CertimakerError && e.status === 409) {
          alunoId = await certimaker.findAlunoIdByCpf(user.cpf);
        }
        if (!alunoId) throw e;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { certimakerAlunoId: alunoId },
      });
    }

    // 2) Curso
    let cursoId = course.certimakerCursoId;
    if (!cursoId) {
      const sum = await prisma.lesson.aggregate({
        where: { module: { courseId } },
        _sum: { durationSeconds: true },
      });
      const fromLabel = course.durationLabel?.match(/(\d+)/)?.[1];
      const cargaHoraria =
        course.workloadHours && course.workloadHours > 0
          ? course.workloadHours
          : fromLabel
            ? Math.max(1, parseInt(fromLabel, 10))
            : Math.max(1, Math.round((sum._sum.durationSeconds ?? 0) / 3600));
      cursoId = await certimaker.createCurso({
        nome: course.title,
        cargaHoraria,
        modalidade: course.modality,
        professor: course.instructor?.name,
        conteudoProgramatico: course.programContent || course.description,
        localCurso: course.location || undefined,
      });
      await prisma.course.update({
        where: { id: courseId },
        data: { certimakerCursoId: cursoId },
      });
    }

    // 3) Turma
    let turmaId = course.certimakerTurmaId;
    if (!turmaId) {
      // Preferimos as datas oficiais da turma (quando cadastradas); senão caímos
      // para as datas reais de matrícula/conclusão do aluno.
      turmaId = await certimaker.createTurma({
        cursoId,
        dataInicio: isoDate(course.startDate ?? enrollment.enrolledAt),
        dataFim: isoDate(course.endDate ?? enrollment.completedAt),
      });
      await prisma.course.update({
        where: { id: courseId },
        data: { certimakerTurmaId: turmaId },
      });
    }

    // 4) Modelo (o do curso, se definido; senão o padrão) + emissão
    const templateId =
      course.certimakerTemplateId ?? (await certimaker.defaultTemplateId());
    const { code } = await certimaker.issueCertificate({
      alunoId,
      turmaId,
      templateId,
    });
    const pdfUrl = certimaker.pdfUrl(code);

    await prisma.certificate.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: { userId: user.id, courseId, code, certificateUrl: pdfUrl },
      update: { code, certificateUrl: pdfUrl },
    });

    // Avisa o aluno com o link do PDF (não bloqueia / não lança).
    if (user.email) {
      const mail = certificateEmail({
        name: user.name,
        courseTitle: course.title,
        pdfUrl,
        code,
      });
      await sendEmail({ to: user.email, ...mail });
    }

    revalidatePath("/aprender", "layout");
    return { ok: true, code, pdfUrl };
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      return { error: "Sem créditos no Certimaker — avise o administrador." };
    }
    if (e instanceof CertimakerError) return { error: e.message };
    return {
      error: e instanceof Error ? e.message : "Falha ao emitir o certificado.",
    };
  }
}

/** Define o CPF do aluno (para quem cadastrou via Google / sem CPF). */
export async function setCpf(value: string): Promise<{ ok?: boolean; error?: string }> {
  const authUser = await getAuthUser();
  if (!authUser) return { error: "Não autenticado" };
  if (!isValidCpf(value)) return { error: "CPF inválido" };
  const cpf = cleanCpf(value);

  const taken = await prisma.user.findFirst({
    where: { cpf, id: { not: authUser.id } },
    select: { id: true },
  });
  if (taken) return { error: "Este CPF já está cadastrado." };

  await prisma.user.update({ where: { id: authUser.id }, data: { cpf } });
  revalidatePath("/aprender", "layout");
  return { ok: true };
}
