import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveArea, type FeaturedCourse, type FinderCourse, type LevelKey } from "./areas";

/**
 * Catálogo para o buscador da v2.
 *
 * Não passa pelo `lib/catalog.ts`: aquele converte a categoria do banco por um
 * mapa que só cobre 4 dos 12 valores do enum, e tudo que sobra vira
 * "Neurociência". Para filtrar, a categoria crua é o que importa.
 *
 * O payload é propositalmente magro (id, título, área, nível, carga). O
 * catálogo inteiro cabe em poucas dezenas de KB, vai junto com a página e o
 * filtro roda no cliente sem uma única ida ao servidor.
 */
export async function getFinderCourses(
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<FinderCourse[]> {
  const rows = await prisma.course.findMany({
    where: includeDrafts ? {} : { published: true },
    select: {
      id: true,
      title: true,
      category: true,
      level: true,
      workloadHours: true,
      published: true,
    },
    // publicado primeiro: senão os rascunhos, que são a maioria esmagadora,
    // afogam os poucos cursos que já dá para ver
    orderBy: [{ published: "desc" }, { title: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    area: resolveArea(String(r.category), r.title),
    level: String(r.level) as LevelKey,
    hours: r.workloadHours,
    live: r.published,
  }));
}

/**
 * Os poucos cursos que a home destaca. Payload maior (descrição, preço), então
 * é consulta à parte: no buscador isso multiplicaria por 265 à toa.
 */
export async function getFeaturedCourses(limit = 4): Promise<FeaturedCourse[]> {
  const rows = await prisma.course.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      level: true,
      workloadHours: true,
      durationLabel: true,
      published: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    area: resolveArea(String(r.category), r.title),
    level: String(r.level) as LevelKey,
    hours: r.workloadHours,
    duration: r.durationLabel,
    live: r.published,
  }));
}
