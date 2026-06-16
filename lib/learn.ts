import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveVideoSource } from "@/server/media";
import type { VideoSource } from "@/server/media/types";

// --- Liberação de conteúdo (gating) -------------------------------------

export interface GatingFields {
  requireSequential: boolean;
  dripEnabled: boolean;
  dripInitialCount: number;
  dripDelayDays: number;
}

export type LessonLock = {
  locked: boolean;
  reason?: "sequential" | "drip";
  unlockAt?: Date;
};

const DAY_MS = 86_400_000;

/** Decide se uma aula está travada por gate sequencial ou drip. */
export function computeLessonLock(opts: {
  index: number;
  firstIncompleteIndex: number;
  course: GatingFields;
  enrolledAt: Date | null;
  now: Date;
}): LessonLock {
  const { index, firstIncompleteIndex, course, enrolledAt, now } = opts;

  // Sequencial: tudo depois da primeira aula não concluída fica travado.
  if (course.requireSequential && index > firstIncompleteIndex) {
    return { locked: true, reason: "sequential" };
  }
  // Drip: as aulas além de `dripInitialCount` só liberam após N dias.
  if (course.dripEnabled && enrolledAt && index >= course.dripInitialCount) {
    const unlockAt = new Date(
      enrolledAt.getTime() + course.dripDelayDays * DAY_MS,
    );
    if (now < unlockAt) return { locked: true, reason: "drip", unlockAt };
  }
  return { locked: false };
}

interface CourseAccess {
  locks: Map<string, LessonLock>;
  firstIncompleteIndex: number;
  resumeLessonId: string | null;
}

export function computeCourseAccess(
  orderedLessonIds: string[],
  completed: Set<string>,
  course: GatingFields,
  enrolledAt: Date | null,
  isStaff: boolean,
  now: Date,
): CourseAccess {
  const firstIncomplete = orderedLessonIds.findIndex((id) => !completed.has(id));
  const firstIncompleteIndex =
    firstIncomplete === -1 ? orderedLessonIds.length : firstIncomplete;

  const locks = new Map<string, LessonLock>();
  orderedLessonIds.forEach((id, index) => {
    locks.set(
      id,
      isStaff
        ? { locked: false }
        : computeLessonLock({ index, firstIncompleteIndex, course, enrolledAt, now }),
    );
  });

  // Retoma na primeira aula não concluída e desbloqueada; senão a 1ª incompleta.
  let resumeLessonId =
    orderedLessonIds.find((id) => !completed.has(id) && !locks.get(id)!.locked) ??
    orderedLessonIds.find((id) => !completed.has(id)) ??
    orderedLessonIds[orderedLessonIds.length - 1] ??
    null;

  return { locks, firstIncompleteIndex, resumeLessonId };
}

// --- Dashboard ----------------------------------------------------------

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

export async function getEnrolledCourses(
  userId: string,
): Promise<EnrolledCourse[]> {
  const now = new Date();
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

  const allIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  );
  const completed = await completedLessonSet(userId, allIds);

  return enrollments.map((e) => {
    const ordered = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const total = ordered.length;
    const done = ordered.filter((id) => completed.has(id)).length;
    const { resumeLessonId } = computeCourseAccess(
      ordered,
      completed,
      e.course,
      e.enrolledAt,
      false,
      now,
    );
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

// --- Página do curso ----------------------------------------------------

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
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      durationSeconds: number | null;
      completed: boolean;
      locked: boolean;
      unlockAt: Date | null;
      hasVideo: boolean;
      hasDocument: boolean;
      hasMaterial: boolean;
    }[];
  }[];
}

export async function getCourseForLearner(
  userId: string,
  slug: string,
  isStaff = false,
): Promise<LearnerCourse | null> {
  const now = new Date();
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

  const enrollment = isStaff
    ? null
    : await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: { enrolledAt: true },
      });
  if (!isStaff && !enrollment) return null;

  const ordered = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completed = await completedLessonSet(userId, ordered);
  const { locks, resumeLessonId } = computeCourseAccess(
    ordered,
    completed,
    course,
    enrollment?.enrolledAt ?? null,
    isStaff,
    now,
  );

  const total = ordered.length;
  const done = ordered.filter((id) => completed.has(id)).length;

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
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => {
        const lock = locks.get(l.id) ?? { locked: false };
        return {
          id: l.id,
          title: l.title,
          durationSeconds: l.durationSeconds,
          completed: completed.has(l.id),
          locked: lock.locked,
          unlockAt: lock.unlockAt ?? null,
          hasVideo: !!l.videoRef,
          hasDocument: !!l.documentFileId,
          hasMaterial: !!l.materialFileId,
        };
      }),
    })),
  };
}

// --- Página da aula -----------------------------------------------------

export interface LearnerLesson {
  courseSlug: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    durationSeconds: number | null;
    hasDocument: boolean;
    hasMaterial: boolean;
  };
  videoSource: VideoSource | null;
  progress: { watchedSeconds: number; completed: boolean };
  lock: LessonLock;
  prevLessonId: string | null;
  nextLessonId: string | null;
  outline: {
    moduleTitle: string;
    lessons: { id: string; title: string; completed: boolean; locked: boolean }[];
  }[];
}

export async function getLessonForLearner(
  userId: string,
  lessonId: string,
  isStaff = false,
): Promise<LearnerLesson | null> {
  const now = new Date();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return null;
  const course = lesson.module.course;

  const enrollment = isStaff
    ? null
    : await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: { enrolledAt: true },
      });
  if (!isStaff && !enrollment) return null;

  const modules = await prisma.module.findMany({
    where: { courseId: course.id },
    orderBy: { order: "asc" },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  const flat = modules.flatMap((m) => m.lessons);
  const orderedIds = flat.map((l) => l.id);
  const idx = orderedIds.indexOf(lessonId);
  const completed = await completedLessonSet(userId, orderedIds);
  const { locks } = computeCourseAccess(
    orderedIds,
    completed,
    course,
    enrollment?.enrolledAt ?? null,
    isStaff,
    now,
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
      content: lesson.content,
      durationSeconds: lesson.durationSeconds,
      hasDocument: !!lesson.documentFileId,
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
    lock: locks.get(lessonId) ?? { locked: false },
    prevLessonId: idx > 0 ? orderedIds[idx - 1] : null,
    nextLessonId: idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null,
    outline: modules.map((m) => ({
      moduleTitle: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        completed: completed.has(l.id),
        locked: (locks.get(l.id) ?? { locked: false }).locked,
      })),
    })),
  };
}

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
