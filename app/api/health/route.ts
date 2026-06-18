import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Healthcheck para o Coolify e monitoração externa.
 *
 * Liveness: responde **200 enquanto o processo Next está de pé** — propositalmente
 * NÃO devolve 5xx quando o banco cai, para não disparar restart-loop no Coolify
 * durante um blip/pausa do Supabase (reiniciar o container não conserta o banco).
 * O estado do banco vai no corpo (`db`) para observabilidade.
 */
export async function GET() {
  let db: "up" | "down" = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "down";
  }
  return NextResponse.json({ status: "ok", db, ts: new Date().toISOString() });
}
