import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PrismaClient,
  Role,
  CourseCategory,
  CourseModality,
} from "@prisma/client";

/**
 * Importa o catálogo de cursos da planilha "Gerador de Certificado" (CG
 * Educacional) para o LMS. Roda no build (Coolify), depois do migrate.
 *
 * Idempotente: cria cursos por `slug` apenas se ainda não existirem — nunca
 * sobrescreve edições feitas no /admin. Re-executar em deploys é seguro.
 */

type CatalogCourse = {
  title: string;
  slug: string;
  description: string;
  category: string;
  workloadHours: number | null;
  modality: string;
  location: string | null;
  startDate: string | null; // yyyy-mm-dd
  endDate: string | null;
  programContent: string | null;
  instructorName: string;
};

const prisma = new PrismaClient();

function toDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function emailFor(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
  return `${slug}@cgeducacional.com.br`;
}

/** Reaproveita um instrutor pelo nome; senão cria um novo (só p/ certificado). */
async function resolveInstructorId(name: string): Promise<string> {
  const existing = await prisma.user.findFirst({
    where: { name, role: { in: [Role.instructor, Role.admin] } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const user = await prisma.user.upsert({
    where: { email: emailFor(name) },
    update: {},
    create: {
      id: randomUUID(),
      email: emailFor(name),
      name,
      role: Role.instructor,
    },
    select: { id: true },
  });
  return user.id;
}

(async () => {
  const file = join(process.cwd(), "prisma/data/catalog-courses.json");
  const catalog = JSON.parse(readFileSync(file, "utf-8")) as CatalogCourse[];
  console.log(`[import-catalog] ${catalog.length} cursos no catálogo.`);

  // Resolve os instrutores (poucos nomes distintos).
  const instructorIdByName = new Map<string, string>();
  for (const name of new Set(catalog.map((c) => c.instructorName))) {
    instructorIdByName.set(name, await resolveInstructorId(name));
  }
  console.log(`[import-catalog] instrutores: ${instructorIdByName.size}.`);

  // Só insere slugs que ainda não existem (preserva edições no /admin).
  const existing = new Set(
    (await prisma.course.findMany({ select: { slug: true } })).map(
      (c) => c.slug,
    ),
  );
  const toCreate = catalog.filter((c) => !existing.has(c.slug));
  console.log(
    `[import-catalog] ${toCreate.length} a criar, ${catalog.length - toCreate.length} já existem.`,
  );

  if (toCreate.length > 0) {
    const result = await prisma.course.createMany({
      skipDuplicates: true,
      data: toCreate.map((c) => ({
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category as CourseCategory,
        modality: c.modality as CourseModality,
        workloadHours: c.workloadHours ?? null,
        location: c.location ?? null,
        startDate: toDate(c.startDate),
        endDate: toDate(c.endDate),
        programContent: c.programContent ?? null,
        instructorId: instructorIdByName.get(c.instructorName)!,
        published: false,
      })),
    });
    console.log(`[import-catalog] ✓ ${result.count} cursos criados (rascunho).`);
  } else {
    console.log("[import-catalog] nada a criar.");
  }
})()
  .catch((e) => {
    console.error("[import-catalog] erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
