import { getCurrentProfile } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { metaFromHeaders } from "@/lib/request-meta";
import { createDocument, EsignError, errorMessage } from "@/server/esign";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Upload de PDF para assinatura (multipart `file`). Só admin. Até 25 MB. */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return Response.json({ error: "Sem permissão" }, { status: 403 });
  }
  const rl = rateLimit(`esign:upload:${profile.id}`, 30, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "Muitos envios seguidos. Aguarde alguns instantes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
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
    const doc = await createDocument(
      {
        bytes: new Uint8Array(await file.arrayBuffer()),
        fileName: file.name || "documento.pdf",
        mime: file.type || undefined,
        title: (form.get("title") as string | null) ?? undefined,
        source: (form.get("source") as string | null) ?? "upload",
      },
      { actor: { id: profile.id, name: profile.name }, ...metaFromHeaders(request.headers) },
    );
    return Response.json({ id: doc.id, code: doc.code, name: file.name });
  } catch (e) {
    const status = e instanceof EsignError ? e.status : 500;
    return Response.json({ error: errorMessage(e, "Falha ao processar o PDF.") }, { status });
  }
}
