import { z } from "zod";
import { apiHandler } from "@/lib/esign-http";
import { documentDto } from "@/lib/esign-api-dto";
import {
  createDocument,
  EsignError,
  fetchPdfFromUrl,
  getDocument,
  listDocuments,
  saveDraft,
  sendDocument,
} from "@/server/esign";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/esign/v1/documents?status=&q=&page=&perPage= — lista paginada. */
export const GET = apiHandler(async (req) => {
  const sp = new URL(req.url).searchParams;
  const res = await listDocuments({
    filter: sp.get("status") ?? undefined,
    q: sp.get("q") ?? undefined,
    page: Number(sp.get("page") ?? "1") || 1,
    perPage: Math.min(100, Number(sp.get("perPage") ?? "20") || 20),
  });
  return { total: res.total, page: res.page, totalPages: res.totalPages, documents: res.rows };
});

const jsonSchema = z.object({
  url: z.string().url(),
  title: z.string().max(160).optional(),
  requireOtp: z.boolean().optional(),
  message: z.string().max(1000).optional(),
  signers: z
    .array(z.object({ name: z.string().optional(), email: z.string().optional(), cpf: z.string().optional() }))
    .max(20)
    .optional(),
  fields: z
    .array(
      z.object({
        signer: z.number().int().min(0),
        kind: z.enum(["signature", "name", "cpf", "date"]),
        page: z.number().int().min(0),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
    )
    .optional(),
  send: z.boolean().optional(),
  sendEmails: z.boolean().optional(),
});

/**
 * POST /api/esign/v1/documents
 *  - multipart: `file` (PDF) + `title?` + `requireOtp?` → cria rascunho
 *  - JSON: { url, title?, requireOtp?, message?, signers?, fields?, send?, sendEmails? }
 *    (`fields[].signer` é o índice em `signers`; x/y/w/h relativos 0..1)
 */
export const POST = apiHandler(async (req, ctx) => {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new EsignError("invalid_input", "Envie o PDF no campo `file`.");
    const doc = await createDocument(
      {
        bytes: new Uint8Array(await file.arrayBuffer()),
        fileName: file.name || "documento.pdf",
        mime: file.type || undefined,
        title: (form.get("title") as string | null) ?? undefined,
        requireOtp: form.get("requireOtp") ? form.get("requireOtp") === "true" : undefined,
        source: "api",
      },
      ctx,
    );
    return Response.json({ id: doc.id, code: doc.code, status: "draft" }, { status: 201 });
  }

  const parsed = jsonSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new EsignError("invalid_input", parsed.error.issues[0]?.message ?? "JSON inválido");
  const input = parsed.data;
  const file = await fetchPdfFromUrl(input.url);
  const doc = await createDocument({ ...file, title: input.title, requireOtp: input.requireOtp, source: "api" }, ctx);

  if (input.signers?.length) {
    const created = await getDocument(doc.id);
    await saveDraft(doc.id, {
      title: created.title,
      requireOtp: input.requireOtp ?? true,
      message: input.message,
      signers: input.signers.map((s, i) => ({ key: `s${i}`, ...s })),
      fields: (input.fields ?? []).map((f) => ({
        signerKey: `s${f.signer}`,
        kind: f.kind,
        page: f.page,
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
      })),
    });
  }
  let links: { signerId: string; link: string }[] | undefined;
  if (input.send) {
    const sent = await sendDocument(doc.id, { sendEmails: Boolean(input.sendEmails) }, ctx);
    links = sent.links.map((l) => ({ signerId: l.signerId, link: l.link }));
  }
  return Response.json({ ...documentDto(await getDocument(doc.id)), links }, { status: 201 });
});
