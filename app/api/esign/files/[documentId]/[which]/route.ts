import { getCurrentProfile } from "@/lib/auth";
import { EsignError, errorMessage, getDocumentFile } from "@/server/esign";
import { pdfResponse } from "@/lib/esign-http";

export const dynamic = "force-dynamic";

/**
 * PDF original ou assinado de um documento (admin). `?download=1` baixa;
 * padrão é exibir no navegador. Nunca expõe URL do storage.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string; which: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return new Response("Sem permissão", { status: 403 });
  const { documentId, which } = await params;
  if (which !== "original" && which !== "signed") return new Response("Não encontrado", { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  try {
    const f = await getDocumentFile(documentId, which);
    return pdfResponse(f.bytes, f.fileName, download);
  } catch (e) {
    return new Response(errorMessage(e), { status: e instanceof EsignError ? e.status : 500 });
  }
}

