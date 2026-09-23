import "server-only";
import { db } from "./deps";
import { maskCpf } from "./format";

/** Consulta pública por código (só o necessário para conferir autenticidade). */
export async function validateByCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^DOC-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return null;
  const doc = await db.esignDocument.findUnique({
    where: { code },
    include: { signers: { orderBy: { order: "asc" } } },
  });
  if (!doc || doc.status === "draft") return null;
  return {
    code: doc.code,
    title: doc.title,
    status: doc.status,
    pageCount: doc.pageCount,
    sentAt: doc.sentAt,
    completedAt: doc.completedAt,
    cancelledAt: doc.cancelledAt,
    originalSha256: doc.originalSha256,
    signedSha256: doc.signedSha256,
    signers: doc.signers.map((s, i) => ({
      // Só o primeiro nome + CPF mascarado (LGPD).
      name: (s.signedName ?? s.name ?? `Signatário ${i + 1}`).split(/\s+/)[0],
      cpf: s.signedCpf ? maskCpf(s.signedCpf) : null,
      status: s.status,
      signedAt: s.signedAt,
    })),
  };
}
