import { apiHandler, pdfResponse } from "@/lib/esign-http";
import { EsignError, getDocumentFile } from "@/server/esign";

export const dynamic = "force-dynamic";

/** GET /api/esign/v1/documents/:id/files/original|signed — bytes do PDF. */
export const GET = apiHandler<{ id: string; which: string }>(async (_req, _ctx, { id, which }) => {
  if (which !== "original" && which !== "signed") throw new EsignError("not_found", "Use original ou signed.");
  const f = await getDocumentFile(id, which);
  return pdfResponse(f.bytes, f.fileName, true);
});
