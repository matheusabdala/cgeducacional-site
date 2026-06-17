import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

// Roda no build (Coolify). Só popula os cursos de demonstração se o banco
// estiver vazio — não sobrescreve nada depois que você cria cursos no /admin.
const prisma = new PrismaClient();

(async () => {
  const count = await prisma.course.count();
  if (count > 0) {
    console.log(`[seed-if-empty] já há ${count} curso(s) — pulando.`);
    return;
  }
  console.log("[seed-if-empty] banco vazio — populando cursos de demonstração…");
  const c = await seedDatabase(prisma);
  console.log(
    `[seed-if-empty] ✓ ${c.courses} cursos, ${c.modules} módulos, ${c.lessons} aulas.`,
  );
})()
  .catch((e) => {
    console.error("[seed-if-empty] erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
