"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type Result = { error?: string; ok?: boolean };

const enrollmentSchema = z.object({
  userId: z.string().min(1, "Aluno inválido"),
  courseId: z.string().min(1, "Curso inválido"),
});

/** Revalida as rotas afetadas por uma mudança de matrícula. */
function revalidateEnrollmentPaths(userId: string) {
  revalidatePath(`/admin/alunos/${userId}`);
  revalidatePath("/admin/alunos");
  // Áreas do aluno que dependem das matrículas
  revalidatePath("/meus-cursos");
  revalidatePath("/dashboard");
}

/**
 * Matricula um aluno num curso. Idempotente: se a matrícula já existe, não falha
 * e retorna ok (a `@@unique([userId, courseId])` garante uma única linha).
 */
export async function enrollUserInCourse(
  userId: string,
  courseId: string,
): Promise<Result> {
  await requireRole(["admin", "instructor"], "/admin");
  const parsed = enrollmentSchema.safeParse({ userId, courseId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: d.userId }, select: { id: true } }),
    prisma.course.findUnique({
      where: { id: d.courseId },
      select: { id: true },
    }),
  ]);
  if (!user) return { error: "Aluno não encontrado" };
  if (!course) return { error: "Curso não encontrado" };

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: d.userId, courseId: d.courseId } },
    update: {},
    create: { userId: d.userId, courseId: d.courseId },
  });

  revalidateEnrollmentPaths(d.userId);
  return { ok: true };
}

/** Remove a matrícula de um aluno num curso (idempotente). */
export async function removeEnrollment(
  userId: string,
  courseId: string,
): Promise<Result> {
  await requireRole(["admin", "instructor"], "/admin");
  const parsed = enrollmentSchema.safeParse({ userId, courseId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;

  await prisma.enrollment.deleteMany({
    where: { userId: d.userId, courseId: d.courseId },
  });

  revalidateEnrollmentPaths(d.userId);
  return { ok: true };
}
