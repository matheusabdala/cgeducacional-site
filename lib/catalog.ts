import "server-only";
import { prisma } from "@/lib/prisma";
import {
  type Course,
  CourseCategory,
  CourseLevel,
} from "@/types";

// Enums do banco (identificadores) → rótulos pt-BR usados na UI pública.
const CAT: Record<string, CourseCategory> = {
  neurociencia: CourseCategory.Neurociencia,
  pedagogia: CourseCategory.Pedagogia,
  gestao: CourseCategory.Gestao,
  inclusao: CourseCategory.Inclusao,
};
const LVL: Record<string, CourseLevel> = {
  iniciante: CourseLevel.Iniciante,
  intermediario: CourseLevel.Intermediario,
  avancado: CourseLevel.Avancado,
};

function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60 ? ` ${m % 60}min` : ""}`;
}

type DbInstructor = { name: string; avatarUrl: string | null; bio: string | null };
type DbCourse = {
  id: string;
  title: string;
  description: string;
  fullDescription: string | null;
  thumbnailUrl: string | null;
  category: string;
  level: string;
  price: unknown; // Prisma.Decimal
  durationLabel: string | null;
  rating: number;
  studentsCount: number;
  instructorId: string;
  instructor: DbInstructor;
  modules?: { title: string; lessons: { title: string; durationSeconds: number | null }[] }[];
  _count?: { modules: number };
};

function toView(c: DbCourse, withSyllabus = false): Course {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    fullDescription: c.fullDescription ?? c.description,
    price: Number(c.price),
    thumbnail: c.thumbnailUrl ?? "",
    level: LVL[c.level] ?? CourseLevel.Iniciante,
    category: CAT[c.category] ?? CourseCategory.Neurociencia,
    duration: c.durationLabel ?? "",
    modules: c.modules?.length ?? c._count?.modules ?? 0,
    rating: c.rating ?? 0,
    students: c.studentsCount ?? 0,
    instructor: {
      id: c.instructorId,
      name: c.instructor?.name ?? "Equipe CG",
      avatar: c.instructor?.avatarUrl ?? "",
      role: "Instrutor(a)",
      bio: c.instructor?.bio ?? undefined,
    },
    syllabus:
      withSyllabus && c.modules
        ? c.modules.map((m) => ({
            title: m.title,
            lessons: m.lessons.map((l) => ({
              title: l.title,
              duration: fmtDuration(l.durationSeconds),
            })),
          }))
        : undefined,
  };
}

const instructorSelect = {
  select: { name: true, avatarUrl: true, bio: true },
} as const;

/** Cursos publicados (vitrine pública). */
export async function getPublishedCourses(): Promise<Course[]> {
  const rows = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      instructor: instructorSelect,
      _count: { select: { modules: true } },
    },
  });
  return rows.map((r) => toView(r as unknown as DbCourse));
}

/** Curso publicado por id, com ementa (página de detalhes). */
export async function getPublishedCourse(id: string): Promise<Course | null> {
  const c = await prisma.course.findFirst({
    where: { id, published: true },
    include: {
      instructor: instructorSelect,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { title: true, durationSeconds: true },
          },
        },
      },
    },
  });
  if (!c) return null;
  return toView(c as unknown as DbCourse, true);
}
