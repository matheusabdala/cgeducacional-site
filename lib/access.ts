import "server-only";
import type { VideoProvider as VideoProviderEnum } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCourseAccess } from "@/lib/learn";

export interface LessonAccess {
  id: string;
  title: string;
  videoProvider: VideoProviderEnum;
  videoRef: string | null;
  content: string | null;
  documentFileId: string | null;
  materialFileId: string | null;
  courseId: string;
  /** Travada por drip/sequencial (sempre false para staff). */
  locked: boolean;
}

/**
 * Retorna a aula se o usuário pode acessá-la, senão `null`. Acesso = matrícula
 * (ou ser instrutor do curso / admin). `locked` indica trava de liberação
 * (drip/sequencial) — as rotas de conteúdo devem recusar quando `locked`.
 */
export async function getLessonForUser(
  lessonId: string,
  userId: string,
): Promise<LessonAccess | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return null;
  const course = lesson.module.course;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isStaff = profile?.role === "admin" || course.instructorId === userId;

  let enrolledAt: Date | null = null;
  if (!isStaff) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { enrolledAt: true },
    });
    if (!enrollment) return null;
    enrolledAt = enrollment.enrolledAt;
  }

  let locked = false;
  if (!isStaff) {
    const modules = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
      include: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
    });
    const orderedIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const rows = await prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: orderedIds }, completed: true },
      select: { lessonId: true },
    });
    const completed = new Set(rows.map((r) => r.lessonId));
    const { locks } = computeCourseAccess(
      orderedIds,
      completed,
      course,
      enrolledAt,
      false,
      new Date(),
    );
    locked = locks.get(lessonId)?.locked ?? false;
  }

  return {
    id: lesson.id,
    title: lesson.title,
    videoProvider: lesson.videoProvider,
    videoRef: lesson.videoRef,
    content: lesson.content,
    documentFileId: lesson.documentFileId,
    materialFileId: lesson.materialFileId,
    courseId: course.id,
    locked,
  };
}
