import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveArea, type FinderCourse, type LevelKey } from "./areas";

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
    orderBy: { title: "asc" },
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
