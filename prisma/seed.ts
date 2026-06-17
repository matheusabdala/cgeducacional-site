import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((c) => {
    console.log(
      `✓ Seed concluído: ${c.users} usuários, ${c.courses} cursos, ${c.modules} módulos, ${c.lessons} aulas.`,
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
