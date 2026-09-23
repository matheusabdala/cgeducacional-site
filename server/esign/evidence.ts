import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./deps";
import { canonicalJson, sha256Hex } from "./crypto";
import type { EsignContext } from "./types";

type Tx = Prisma.TransactionClient;

export type EventInput = {
  documentId: string;
  signerId?: string | null;
  type: string;
  data?: Record<string, unknown>;
  ctx?: EsignContext;
};

function eventHash(e: {
  prevHash: string | null;
  type: string;
  signerId: string | null;
  createdAt: Date;
  ip: string | null;
  data: unknown;
}): string {
  return sha256Hex(
    [e.prevHash ?? "", e.type, e.signerId ?? "", e.createdAt.toISOString(), e.ip ?? "", canonicalJson(e.data ?? null)].join("|"),
  );
}

/** Serializa escritas por documento (evita bifurcar a cadeia de hash). */
export async function lockDocument(tx: Tx, documentId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`esign:${documentId}`}))`;
}

/**
 * Registra um evento na trilha de auditoria, encadeado ao anterior.
 * Deve rodar dentro de uma transação que já chamou `lockDocument`.
 */
export async function appendEvent(tx: Tx, input: EventInput) {
  const last = await tx.esignEvent.findFirst({
    where: { documentId: input.documentId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { hash: true, createdAt: true },
  });
  // createdAt estritamente crescente (mesmo milissegundo → +1ms) p/ ordem estável.
  let createdAt = new Date();
  if (last && createdAt <= last.createdAt) createdAt = new Date(last.createdAt.getTime() + 1);
  const ip = input.ctx?.ip ?? null;
  const signerId = input.signerId ?? null;
  const data = (input.data ?? null) as Prisma.InputJsonValue | null;
  const prevHash = last?.hash ?? null;
  const hash = eventHash({ prevHash, type: input.type, signerId, createdAt, ip, data });
  await tx.esignEvent.create({
    data: {
      documentId: input.documentId,
      signerId,
      type: input.type,
      ip,
      userAgent: input.ctx?.userAgent ?? null,
      data: data ?? undefined,
      prevHash,
      hash,
      createdAt,
    },
  });
}

/** Atalho: transação curta com lock + um evento. */
export async function recordEvent(input: EventInput) {
  await db.$transaction(async (tx) => {
    await lockDocument(tx, input.documentId);
    await appendEvent(tx, input);
  });
}

/** Recalcula a cadeia; `ok:false` indica que algum evento foi alterado/removido. */
export async function verifyAuditChain(
  documentId: string,
  // Eventos já carregados (ordenados por createdAt, id) evitam uma consulta extra.
  preloaded?: { id: string; type: string; signerId: string | null; ip: string | null; data: unknown; prevHash: string | null; hash: string; createdAt: Date }[],
): Promise<{ ok: boolean; count: number; brokenAt?: string }> {
  const events =
    preloaded ??
    (await db.esignEvent.findMany({
      where: { documentId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }));
  let prev: string | null = null;
  for (const e of events) {
    const expected = eventHash({
      prevHash: prev,
      type: e.type,
      signerId: e.signerId,
      createdAt: e.createdAt,
      ip: e.ip,
      data: e.data,
    });
    if (e.prevHash !== prev || e.hash !== expected) {
      return { ok: false, count: events.length, brokenAt: e.id };
    }
    prev = e.hash;
  }
  return { ok: true, count: events.length };
}
