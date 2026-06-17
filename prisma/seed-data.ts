import { randomUUID } from "node:crypto";
import {
  type PrismaClient,
  Role,
  CourseLevel,
  CourseCategory,
} from "@prisma/client";
import { COURSES, INSTRUCTORS } from "../constants";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "25 min" / "1h" / "1h30" → segundos. */
function durationToSeconds(label: string): number {
  const hours = label.match(/(\d+)\s*h/i);
  const minutes = label.match(/(\d+)\s*min/i);
  const h = hours ? parseInt(hours[1], 10) : 0;
  const m = minutes ? parseInt(minutes[1], 10) : 0;
  return h * 3600 + m * 60;
}

const CATEGORY_MAP: Record<string, CourseCategory> = {
  Neurociência: CourseCategory.neurociencia,
  Pedagogia: CourseCategory.pedagogia,
  "Gestão Escolar": CourseCategory.gestao,
  Inclusão: CourseCategory.inclusao,
};

const LEVEL_MAP: Record<string, CourseLevel> = {
  Iniciante: CourseLevel.iniciante,
  Intermediário: CourseLevel.intermediario,
  Avançado: CourseLevel.avancado,
};

const instructorEmail = (id: string) => `${id}@cgeducacional.demo`;

/** Popula instrutores + cursos + módulos + aulas a partir de constants.ts. */
export async function seedDatabase(prisma: PrismaClient) {
  const instructorIdByLegacy = new Map<string, string>();

  for (const inst of INSTRUCTORS) {
    const email = instructorEmail(inst.id);
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: inst.name,
        role: Role.instructor,
        avatarUrl: inst.avatar,
        bio: inst.bio,
      },
      create: {
        id: randomUUID(),
        email,
        name: inst.name,
        role: Role.instructor,
        avatarUrl: inst.avatar,
        bio: inst.bio,
      },
    });
    instructorIdByLegacy.set(inst.id, user.id);
  }

  for (const course of COURSES) {
    const instructorId = instructorIdByLegacy.get(course.instructor.id);
    if (!instructorId) {
      throw new Error(`Instrutor não encontrado para o curso ${course.title}`);
    }

    const data = {
      title: course.title,
      description: course.description,
      fullDescription: course.fullDescription,
      thumbnailUrl: course.thumbnail,
      category: CATEGORY_MAP[course.category],
      level: LEVEL_MAP[course.level],
      price: course.price,
      durationLabel: course.duration,
      rating: course.rating,
      studentsCount: course.students,
      published: true,
      instructorId,
    };

    const saved = await prisma.course.upsert({
      where: { slug: slugify(course.title) },
      update: data,
      create: { slug: slugify(course.title), ...data },
    });

    await prisma.module.deleteMany({ where: { courseId: saved.id } });

    const syllabus = course.syllabus ?? [];
    for (let mIdx = 0; mIdx < syllabus.length; mIdx++) {
      const mod = syllabus[mIdx];
      await prisma.module.create({
        data: {
          courseId: saved.id,
          title: mod.title,
          order: mIdx + 1,
          lessons: {
            create: mod.lessons.map((lesson, lIdx) => ({
              title: lesson.title,
              order: lIdx + 1,
              durationSeconds: durationToSeconds(lesson.duration),
            })),
          },
        },
      });
    }
  }

  const [users, courses, modules, lessons] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.module.count(),
    prisma.lesson.count(),
  ]);
  return { users, courses, modules, lessons };
}
