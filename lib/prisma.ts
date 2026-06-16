import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma singleton. Em dev, o hot-reload do Next recria módulos a cada
 * mudança; sem o cache global isso abriria conexões demais. Use apenas no
 * servidor (Server Components, Actions, Route Handlers) — nunca no cliente.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
