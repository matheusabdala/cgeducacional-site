import "server-only";
import type { VideoProvider as VideoProviderEnum } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface LessonAccess {
  id: string;
  title: string;
  videoProvider: VideoProviderEnum;
  videoRef: string | null;
  materialFileId: string | null;
  courseId: string;
}

/**
 * Retorna a aula se o usuário pode acessá-la, senão `null`. Acesso =
 * matrícula no curso, ou ser o instrutor do curso, ou admin.
 */
export async function getLessonForUser(
  lessonId: string,
  userId: string,
): Promise<LessonAccess | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      videoProvider: true,
      videoRef: true,
      materialFileId: true,
      module: {
        select: { course: { select: { id: true, instructorId: true } } },
      },
    },
  });
  if (!lesson) return null;

  const course = lesson.module.course;
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isStaff = profile?.role === "admin" || course.instructorId === userId;
  if (!isStaff) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { id: true },
    });
    if (!enrollment) return null;
  }

  return {
    id: lesson.id,
    title: lesson.title,
    videoProvider: lesson.videoProvider,
    videoRef: lesson.videoRef,
    materialFileId: lesson.materialFileId,
    courseId: course.id,
  };
}
