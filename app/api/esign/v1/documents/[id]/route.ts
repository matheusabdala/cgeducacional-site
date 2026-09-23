import { apiHandler } from "@/lib/esign-http";
import { documentDto } from "@/lib/esign-api-dto";
import { deleteDraft, getDocument } from "@/server/esign";

export const dynamic = "force-dynamic";

/** GET /api/esign/v1/documents/:id — documento, signatários, campos e trilha de auditoria. */
export const GET = apiHandler<{ id: string }>(async (_req, _ctx, { id }) => documentDto(await getDocument(id)));

/** DELETE /api/esign/v1/documents/:id — só rascunhos. */
export const DELETE = apiHandler<{ id: string }>(async (_req, _ctx, { id }) => {
  await deleteDraft(id);
  return { ok: true };
});
