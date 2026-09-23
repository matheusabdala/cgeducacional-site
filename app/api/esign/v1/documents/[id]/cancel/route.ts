import { apiHandler } from "@/lib/esign-http";
import { cancelDocument } from "@/server/esign";

export const dynamic = "force-dynamic";

/** POST /api/esign/v1/documents/:id/cancel — links param de funcionar. */
export const POST = apiHandler<{ id: string }>(async (_req, ctx, { id }) => {
  await cancelDocument(id, ctx);
  return { ok: true };
});
