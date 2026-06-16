"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getLessonForUser } from "@/lib/access";

type Result = { error?: string; ok?: boolean; courseCompleted?: boolean };

const progressSchema = z.object({
  lessonId: z.string().min(1),
  watchedSeconds: z.coerce.number().int().min(0),
});

/** Salva a posição assistida (resume). Chamado periodicamente pelo player. */
export async function saveProgress(input: unknown): Promise<Result> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos" };
  const { lessonId, watchedSeconds } = parsed.data;

  const user = await getAuthUser();
  if (!user) return { error: "Não autenticado" };
  const lesson = await getLessonForUser(lessonId, user.id);
  if (!lesson) return { error: "Sem acesso" };
  if (lesson.locked) return { error: "Aula bloqueada" };

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, watchedSeconds },
    update: { watchedSeconds, lastWatchedAt: new Date() },
  });
  return { ok: true };
}

async function setCompleted(
  lessonId: string,
  completed: boolean,
): Promise<Result> {
  const user = await getAuthUser();
  if (!user) return { error: "Não autenticado" };
  const lesson = await getLessonForUser(lessonId, user.id);
  if (!lesson) return { error: "Sem acesso" };
  if (lesson.locked) return { error: "Aula bloqueada" };

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completed, watchedSeconds: 0 },
    update: { completed, lastWatchedAt: new Date() },
  });

  // Atualiza a conclusão do curso (matrícula).
  const courseId = lesson.courseId;
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { userId: user.id, completed: true, lesson: { module: { courseId } } },
    }),
  ]);
  const courseCompleted = total > 0 && done >= total;
  await prisma.enrollment.updateMany({
    where: { userId: user.id, courseId },
    data: { completedAt: courseCompleted ? new Date() : null },
  });

  revalidatePath("/aprender", "layout");
  return { ok: true, courseCompleted };
}

/** Marca a aula como concluída (e o curso, se 100%). */
export async function markLessonComplete(lessonId: string): Promise<Result> {
  return setCompleted(lessonId, true);
}

/** Desmarca a conclusão da aula. */
export async function markLessonIncomplete(lessonId: string): Promise<Result> {
  return setCompleted(lessonId, false);
}
