import { rateLimit } from "@/lib/rate-limit";
import { metaFromHeaders } from "@/lib/request-meta";
import { EsignError, errorMessage, getFileForSigner } from "@/server/esign";
import { pdfResponse } from "@/lib/esign-http";

export const dynamic = "force-dynamic";

/** PDF para o signatário (autorizado pelo próprio link). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; which: string }> },
) {
  const { token, which } = await params;
  if (which !== "original" && which !== "signed") return new Response("Não encontrado", { status: 404 });
  const { ip } = metaFromHeaders(request.headers);
  if (!rateLimit(`esign:file:${ip ?? "?"}`, 60, 60_000).ok) {
    return new Response("Muitas requisições", { status: 429 });
  }
  const download = new URL(request.url).searchParams.get("download") === "1";
  try {
    const f = await getFileForSigner(token, which);
    return pdfResponse(f.bytes, f.fileName, download);
  } catch (e) {
    return new Response(errorMessage(e), { status: e instanceof EsignError ? e.status : 500 });
  }
}
