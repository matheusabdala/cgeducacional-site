import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveVideoSource } from "@/server/media";
import type { VideoSource } from "@/server/media/types";

/** Curso matriculado com progresso (para o dashboard do aluno). */
export interface EnrolledCourse {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  total: number;
  done: number;
  percent: number;
  resumeLessonId: string | null;
  completedAt: Date | null;
}

/** Lista os cursos do aluno com % concluído e a aula para retomar. */
export async function getEnrolledCourses(
  userId: string,
): Promise<EnrolledCourse[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: { orderBy: { order: "asc" }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  const lessonIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  );
  const completed = await completedLessonSet(userId, lessonIds);

  return enrollments.map((e) => {
    const ordered = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const total = ordered.length;
    const done = ordered.filter((id) => completed.has(id)).length;
    const resumeLessonId =
      ordered.find((id) => !completed.has(id)) ?? ordered[ordered.length - 1] ?? null;
    return {
      id: e.course.id,
      slug: e.course.slug,
      title: e.course.title,
      thumbnailUrl: e.course.thumbnailUrl,
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
      resumeLessonId,
      completedAt: e.completedAt,
    };
  });
}

export interface LearnerCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  total: number;
  done: number;
  percent: number;
  resumeLessonId: string | null;
  completedAt: Date | null;
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      durationSeconds: number | null;
      completed: boolean;
      hasVideo: boolean;
      hasMaterial: boolean;
    }[];
  }[];
}

/** Curso do aluno (página do curso). `null` se não matriculado / não existe. */
export async function getCourseForLearner(
  userId: string,
  slug: string,
  isStaff = false,
): Promise<LearnerCourse | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) return null;

  if (!isStaff) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { id: true },
    });
    if (!enrollment) return null;
  }

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completed = await completedLessonSet(userId, allLessonIds);

  const total = allLessonIds.length;
  const done = allLessonIds.filter((id) => completed.has(id)).length;
  const resumeLessonId =
    allLessonIds.find((id) => !completed.has(id)) ??
    allLessonIds[allLessonIds.length - 1] ??
    null;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    resumeLessonId,
    completedAt: null,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        durationSeconds: l.durationSeconds,
        completed: completed.has(l.id),
        hasVideo: !!l.videoRef,
        hasMaterial: !!l.materialFileId,
      })),
    })),
  };
}

export interface LearnerLesson {
  courseSlug: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    durationSeconds: number | null;
    hasMaterial: boolean;
  };
  videoSource: VideoSource | null;
  progress: { watchedSeconds: number; completed: boolean };
  prevLessonId: string | null;
  nextLessonId: string | null;
  // Navegação lateral (todos os módulos/aulas do curso com estado)
  outline: {
    moduleTitle: string;
    lessons: { id: string; title: string; completed: boolean }[];
  }[];
}

/** Dados da página de aula do aluno. `null` se sem acesso / não existe. */
export async function getLessonForLearner(
  userId: string,
  lessonId: string,
  isStaff = false,
): Promise<LearnerLesson | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return null;
  const course = lesson.module.course;

  if (!isStaff) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { id: true },
    });
    if (!enrollment) return null;
  }

  // Ordem linear das aulas do curso (para prev/next e outline).
  const modules = await prisma.module.findMany({
    where: { courseId: course.id },
    orderBy: { order: "asc" },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  const flat = modules.flatMap((m) => m.lessons);
  const idx = flat.findIndex((l) => l.id === lessonId);
  const completedSet = await completedLessonSet(
    userId,
    flat.map((l) => l.id),
  );

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { watchedSeconds: true, completed: true },
  });

  return {
    courseSlug: course.slug,
    courseTitle: course.title,
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      durationSeconds: lesson.durationSeconds,
      hasMaterial: !!lesson.materialFileId,
    },
    videoSource: resolveVideoSource({
      id: lesson.id,
      videoProvider: lesson.videoProvider,
      videoRef: lesson.videoRef,
    }),
    progress: {
      watchedSeconds: progress?.watchedSeconds ?? 0,
      completed: progress?.completed ?? false,
    },
    prevLessonId: idx > 0 ? flat[idx - 1].id : null,
    nextLessonId: idx < flat.length - 1 ? flat[idx + 1].id : null,
    outline: modules.map((m) => ({
      moduleTitle: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        completed: completedSet.has(l.id),
      })),
    })),
  };
}

/** Conjunto de ids de aulas concluídas pelo usuário (dentre as informadas). */
async function completedLessonSet(
  userId: string,
  lessonIds: string[],
): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, completed: true },
    select: { lessonId: true },
  });
  return new Set(rows.map((r) => r.lessonId));
}
