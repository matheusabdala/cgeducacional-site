import "server-only";
import type { getDocument } from "@/server/esign";

type Doc = Awaited<ReturnType<typeof getDocument>>;

/** Representação pública de um documento na REST v1 (sem tokens/segredos/caminhos). */
export function documentDto(d: Doc) {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    status: d.status,
    pageCount: d.pageCount,
    pageSizes: d.pageSizes,
    requireOtp: d.requireOtp,
    message: d.message,
    originalName: d.originalName,
    originalSha256: d.originalSha256,
    signedSha256: d.signedSha256,
    signedVersion: d.signedVersion,
    createdByName: d.createdByName,
    createdAt: d.createdAt,
    sentAt: d.sentAt,
    completedAt: d.completedAt,
    cancelledAt: d.cancelledAt,
    signers: d.signers.map((s) => ({
      id: s.id,
      order: s.order,
      name: s.name,
      email: s.email,
      status: s.status,
      viewedAt: s.viewedAt,
      signedAt: s.signedAt,
      signedName: s.signedName,
      signedCpf: s.signedCpf,
      signedEmail: s.signedEmail,
      signatureMethod: s.signatureMethod,
      signedIp: s.signedIp,
      signedDevice: s.signedDevice,
    })),
    fields: d.fields.map((f) => ({ id: f.id, signerId: f.signerId, kind: f.kind, page: f.page, x: f.x, y: f.y, w: f.w, h: f.h })),
    events: d.events.map((e) => ({ type: e.type, signerId: e.signerId, ip: e.ip, data: e.data, createdAt: e.createdAt, hash: e.hash })),
  };
}
