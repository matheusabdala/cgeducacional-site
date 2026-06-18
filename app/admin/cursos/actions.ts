"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { certimaker } from "@/server/certimaker/client";
import {
  courseSchema,
  moduleSchema,
  lessonSchema,
} from "@/lib/validations/course";

type Result = { error?: string; ok?: boolean };

/** Gera uma URL de SSO para abrir o criador de modelos no Certimaker. */
export async function openCertimakerCreator(): Promise<{
  url?: string;
  error?: string;
}> {
  await requireRole(["admin", "instructor"], "/admin");
  try {
    const url = await certimaker.ssoLink("/modelos");
    return { url };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao abrir o Certimaker",
    };
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Garante que o usuário é admin ou dono do curso. Retorna o profile. */
async function assertCourseAccess(courseId: string) {
  const profile = await requireRole(["admin", "instructor"], "/admin");
  if (profile.role === "admin") return profile;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course || course.instructorId !== profile.id) {
    redirect("/admin/cursos");
  }
  return profile;
}

async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base) || "curso";
  const existing = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) return slug;
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- Curso --------------------------------------------------------------

export async function createCourse(values: unknown): Promise<Result> {
  const profile = await requireRole(["admin", "instructor"], "/admin");
  const parsed = courseSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;
  const course = await prisma.course.create({
    data: {
      title: d.title,
      slug: await uniqueSlug(d.title),
      description: d.description,
      fullDescription: d.fullDescription || null,
      category: d.category,
      level: d.level,
      price: d.price,
      durationLabel: d.durationLabel || null,
      thumbnailUrl: d.thumbnailUrl || null,
      programContent: d.programContent || null,
      workloadHours: d.workloadHours ?? null,
      modality: d.modality,
      location: d.location || null,
      requireSequential: d.requireSequential,
      dripEnabled: d.dripEnabled,
      dripInitialCount: d.dripInitialCount,
      dripDelayDays: d.dripDelayDays,
      certimakerTemplateId: d.certimakerTemplateId || null,
      instructorId: profile.id,
    },
  });
  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${course.id}`);
}

export async function updateCourse(
  id: string,
  values: unknown,
): Promise<Result> {
  await assertCourseAccess(id);
  const parsed = courseSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const d = parsed.data;
  await prisma.course.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      fullDescription: d.fullDescription || null,
      category: d.category,
      level: d.level,
      price: d.price,
      durationLabel: d.durationLabel || null,
      thumbnailUrl: d.thumbnailUrl || null,
      programContent: d.programContent || null,
      workloadHours: d.workloadHours ?? null,
      modality: d.modality,
      location: d.location || null,
      requireSequential: d.requireSequential,
      dripEnabled: d.dripEnabled,
      dripInitialCount: d.dripInitialCount,
      dripDelayDays: d.dripDelayDays,
      certimakerTemplateId: d.certimakerTemplateId || null,
    },
  });
  revalidatePath(`/admin/cursos/${id}`);
  revalidatePath("/admin/cursos");
  return { ok: true };
}

export async function togglePublish(
  id: string,
  published: boolean,
): Promise<Result> {
  await assertCourseAccess(id);
  await prisma.course.update({ where: { id }, data: { published } });
  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${id}`);
  return { ok: true };
}

export async function deleteCourse(id: string): Promise<Result> {
  await assertCourseAccess(id);
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos");
}

// --- Módulo -------------------------------------------------------------

export async function createModule(
  courseId: string,
  values: unknown,
): Promise<Result> {
  await assertCourseAccess(courseId);
  const parsed = moduleSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.module.create({
    data: {
      courseId,
      title: parsed.data.title,
      order: (last?.order ?? 0) + 1,
    },
  });
  revalidatePath(`/admin/cursos/${courseId}`);
  return { ok: true };
}

export async function updateModule(
  id: string,
  values: unknown,
): Promise<Result> {
  const mod = await prisma.module.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!mod) return { error: "Módulo não encontrado" };
  await assertCourseAccess(mod.courseId);
  const parsed = moduleSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  await prisma.module.update({
    where: { id },
    data: { title: parsed.data.title },
  });
  revalidatePath(`/admin/cursos/${mod.courseId}`);
  return { ok: true };
}

export async function deleteModule(id: string): Promise<Result> {
  const mod = await prisma.module.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!mod) return { error: "Módulo não encontrado" };
  await assertCourseAccess(mod.courseId);
  await prisma.module.delete({ where: { id } });
  revalidatePath(`/admin/cursos/${mod.courseId}`);
  return { ok: true };
}

/** Reordena um módulo trocando a posição com o vizinho. */
export async function moveModule(
  id: string,
  direction: "up" | "down",
): Promise<Result> {
  const mod = await prisma.module.findUnique({ where: { id } });
  if (!mod) return { error: "Módulo não encontrado" };
  await assertCourseAccess(mod.courseId);
  const neighbor = await prisma.module.findFirst({
    where: {
      courseId: mod.courseId,
      order: direction === "up" ? { lt: mod.order } : { gt: mod.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return { ok: true };
  await prisma.$transaction([
    prisma.module.update({ where: { id: mod.id }, data: { order: -1 } }),
    prisma.module.update({
      where: { id: neighbor.id },
      data: { order: mod.order },
    }),
    prisma.module.update({
      where: { id: mod.id },
      data: { order: neighbor.order },
    }),
  ]);
  revalidatePath(`/admin/cursos/${mod.courseId}`);
  return { ok: true };
}

// --- Aula ---------------------------------------------------------------

export async function createLesson(
  moduleId: string,
  values: unknown,
): Promise<Result> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) return { error: "Módulo não encontrado" };
  await assertCourseAccess(mod.courseId);
  const parsed = lessonSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const last = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.lesson.create({
    data: {
      moduleId,
      title: d.title,
      description: d.description || null,
      durationSeconds: d.durationSeconds || null,
      videoProvider: d.videoProvider,
      videoRef: d.videoRef || null,
      content: d.content || null,
      documentFileId: d.documentFileId || null,
      materialFileId: d.materialFileId || null,
      order: (last?.order ?? 0) + 1,
    },
  });
  revalidatePath(`/admin/cursos/${mod.courseId}`);
  return { ok: true };
}

export async function updateLesson(
  id: string,
  values: unknown,
): Promise<Result> {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return { error: "Aula não encontrada" };
  await assertCourseAccess(lesson.module.courseId);
  const parsed = lessonSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  await prisma.lesson.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description || null,
      durationSeconds: d.durationSeconds || null,
      videoProvider: d.videoProvider,
      videoRef: d.videoRef || null,
      content: d.content || null,
      documentFileId: d.documentFileId || null,
      materialFileId: d.materialFileId || null,
    },
  });
  revalidatePath(`/admin/cursos/${lesson.module.courseId}`);
  return { ok: true };
}

export async function deleteLesson(id: string): Promise<Result> {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return { error: "Aula não encontrada" };
  await assertCourseAccess(lesson.module.courseId);
  await prisma.lesson.delete({ where: { id } });
  revalidatePath(`/admin/cursos/${lesson.module.courseId}`);
  return { ok: true };
}

export async function moveLesson(
  id: string,
  direction: "up" | "down",
): Promise<Result> {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) return { error: "Aula não encontrada" };
  await assertCourseAccess(lesson.module.courseId);
  const neighbor = await prisma.lesson.findFirst({
    where: {
      moduleId: lesson.moduleId,
      order: direction === "up" ? { lt: lesson.order } : { gt: lesson.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return { ok: true };
  await prisma.$transaction([
    prisma.lesson.update({ where: { id: lesson.id }, data: { order: -1 } }),
    prisma.lesson.update({
      where: { id: neighbor.id },
      data: { order: lesson.order },
    }),
    prisma.lesson.update({
      where: { id: lesson.id },
      data: { order: neighbor.order },
    }),
  ]);
  revalidatePath(`/admin/cursos/${lesson.module.courseId}`);
  return { ok: true };
}

/**
 * Reordena todos os módulos do curso conforme `orderedIds` (drag & drop).
 * Aplica em duas passadas (ordens temporárias negativas → finais) para não
 * violar o unique `[courseId, order]` no meio da transação.
 */
export async function reorderModules(
  courseId: string,
  orderedIds: string[],
): Promise<Result> {
  await assertCourseAccess(courseId);
  const count = await prisma.module.count({
    where: { courseId, id: { in: orderedIds } },
  });
  if (count !== orderedIds.length) return { error: "Lista inválida" };

  await prisma.$transaction([
    ...orderedIds.map((id, i) =>
      prisma.module.update({ where: { id }, data: { order: -(i + 1) } }),
    ),
    ...orderedIds.map((id, i) =>
      prisma.module.update({ where: { id }, data: { order: i + 1 } }),
    ),
  ]);
  revalidatePath(`/admin/cursos/${courseId}`);
  return { ok: true };
}

/** Reordena as aulas de um módulo conforme `orderedIds` (drag & drop). */
export async function reorderLessons(
  moduleId: string,
  orderedIds: string[],
): Promise<Result> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) return { error: "Módulo não encontrado" };
  await assertCourseAccess(mod.courseId);
  const count = await prisma.lesson.count({
    where: { moduleId, id: { in: orderedIds } },
  });
  if (count !== orderedIds.length) return { error: "Lista inválida" };

  await prisma.$transaction([
    ...orderedIds.map((id, i) =>
      prisma.lesson.update({ where: { id }, data: { order: -(i + 1) } }),
    ),
    ...orderedIds.map((id, i) =>
      prisma.lesson.update({ where: { id }, data: { order: i + 1 } }),
    ),
  ]);
  revalidatePath(`/admin/cursos/${mod.courseId}`);
  return { ok: true };
}
