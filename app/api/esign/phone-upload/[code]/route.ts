import { rateLimit } from "@/lib/rate-limit";
import { metaFromHeaders } from "@/lib/request-meta";
import { consumeUploadSession, EsignError, errorMessage } from "@/server/esign";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Upload feito pelo celular do operador (página aberta pelo QR code).
 * Autorizado pelo código de uso único da sessão — sem login no celular.
 */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const meta = metaFromHeaders(request.headers);
  if (!rateLimit(`esign:phone-upload:${meta.ip ?? "?"}`, 20, 10 * 60_000).ok) {
    return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Envio inválido." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Arquivo ausente" }, { status: 400 });
  try {
    const doc = await consumeUploadSession(
      code,
      { bytes: new Uint8Array(await file.arrayBuffer()), fileName: file.name || "documento.pdf", mime: file.type || undefined },
      meta,
    );
    return Response.json({ ok: true, code: doc.code });
  } catch (e) {
    return Response.json(
      { error: errorMessage(e, "Falha ao processar o PDF.") },
      { status: e instanceof EsignError ? e.status : 500 },
    );
  }
}
