import { apiHandler } from "@/lib/esign-http";
import { EsignError, saveDraft } from "@/server/esign";

export const dynamic = "force-dynamic";

/**
 * PUT /api/esign/v1/documents/:id/draft — substitui o rascunho inteiro:
 * { title, requireOtp, message?, signers: [{ key, id?, name?, email?, cpf? }],
 *   fields: [{ signerKey, kind, page, x, y, w, h }] }  (x/y/w/h relativos 0..1)
 */
export const PUT = apiHandler<{ id: string }>(async (req, _ctx, { id }) => {
  const body = await req.json().catch(() => null);
  if (!body) throw new EsignError("invalid_input", "JSON inválido");
  return saveDraft(id, body);
});
