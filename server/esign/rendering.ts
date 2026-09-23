import "server-only";
import type { Prisma } from "@prisma/client";
import { db, logoPng } from "./deps";
import { PDF_MIME } from "./config";
import { sha256Hex } from "./crypto";
import { appendEvent, lockDocument } from "./evidence";
import { renderSignedPdf, type RenderSigner } from "./pdf/render";
import { sealWithCertificate } from "./pdf/seal";
import { paths, storage } from "./storage";
import { validationLink } from "./documents";
import type { EsignContext, Geo, PageBox } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Regera `signed.pdf` a partir do original com todas as assinaturas já feitas.
 * Roda dentro da transação do chamador (com o lock do documento), para duas
 * assinaturas simultâneas não gerarem versões que "esquecem" uma à outra.
 */
export async function rebuildSignedPdf(tx: Tx, documentId: string, ctx: EsignContext) {
  await lockDocument(tx, documentId);
  const doc = await tx.esignDocument.findUnique({
    where: { id: documentId },
    include: { signers: { orderBy: { order: "asc" } }, fields: true },
  });
  if (!doc) return null;

  const store = storage();
  const original = await store.get(doc.originalPath);
  const signers: RenderSigner[] = [];
  for (const [i, s] of doc.signers.entries()) {
    const png = s.status === "signed" && s.signaturePath ? await store.get(s.signaturePath) : null;
    signers.push({
      id: s.id,
      order: s.order,
      label: s.name || s.signedName || `Signatário ${i + 1}`,
      status: s.status,
      signedName: s.signedName,
      signedCpf: s.signedCpf,
      signedEmail: s.signedEmail,
      signedAt: s.signedAt,
      method: s.signatureMethod,
      ip: s.signedIp,
      device: s.signedDevice,
      phoneIp: s.phoneIp,
      phoneDevice: s.phoneDevice,
      otpEmail: s.otpEmail,
      otpVerifiedAt: s.otpVerifiedAt,
      geo: (s.signedGeo as Geo | null) ?? null,
      signatureSha256: s.signatureSha256,
      png,
    });
  }

  const allSigned = signers.length > 0 && signers.every((s) => s.status === "signed");
  const completedAt = allSigned ? doc.completedAt ?? new Date() : null;

  const rendered = await renderSignedPdf({
    original,
    code: doc.code,
    title: doc.title,
    originalName: doc.originalName,
    originalSha256: doc.originalSha256,
    pageCount: doc.pageCount,
    pageSizes: doc.pageSizes as unknown as PageBox[],
    status: allSigned ? "completed" : doc.status,
    createdByName: doc.createdByName,
    createdAt: doc.createdAt,
    completedAt,
    requireOtp: doc.requireOtp,
    signers,
    fields: doc.fields,
    validationUrl: validationLink(doc.code),
    logoPng: await logoPng(),
  });
  const bytes = await sealWithCertificate(rendered);
  const signedSha256 = sha256Hex(bytes);
  const signedPath = paths.signed(doc.code);
  await store.put(signedPath, bytes, PDF_MIME);

  const version = doc.signedVersion + 1;
  await tx.esignDocument.update({
    where: { id: doc.id },
    data: {
      signedPath,
      signedSha256,
      signedVersion: version,
      ...(allSigned && doc.status !== "completed" ? { status: "completed", completedAt } : {}),
    },
  });
  await appendEvent(tx, {
    documentId: doc.id,
    type: "pdf_rendered",
    ctx,
    data: { version, sha256: signedSha256, signed: signers.filter((s) => s.status === "signed").length, total: signers.length },
  });
  if (allSigned && doc.status !== "completed") {
    await appendEvent(tx, { documentId: doc.id, type: "completed", ctx, data: { sha256: signedSha256 } });
  }
  return { completed: allSigned && doc.status !== "completed", signedSha256 };
}
