import { Readable } from "node:stream";
import { getAuthUser } from "@/lib/auth";
import { getLessonForUser } from "@/lib/access";
import { getStorageProvider } from "@/server/media";

export const dynamic = "force-dynamic";

/**
 * Serve um arquivo do Drive de uma aula. `?which=document` serve o PDF da aula
 * (padrão `material`, o material de apoio). `?inline=1` exibe no navegador
 * (para embed do PDF) em vez de baixar. Valida matrícula + trava de liberação.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;
  const { searchParams } = new URL(request.url);
  const which = searchParams.get("which") === "document" ? "document" : "material";
  const inline = searchParams.get("inline") === "1";

  const user = await getAuthUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const lesson = await getLessonForUser(lessonId, user.id);
  if (!lesson) return new Response("Sem acesso", { status: 403 });
  if (lesson.locked) return new Response("Aula bloqueada", { status: 403 });

  const fileId =
    which === "document" ? lesson.documentFileId : lesson.materialFileId;
  if (!fileId) return new Response("Arquivo indisponível", { status: 404 });

  const file = await getStorageProvider().getStream(fileId);

  const headers = new Headers({
    "Content-Type": file.mimeType,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.name)}"`,
    "Cache-Control": "private, no-store",
  });
  if (file.contentLength != null) {
    headers.set("Content-Length", String(file.contentLength));
  }

  const body = Readable.toWeb(
    file.stream as Readable,
  ) as unknown as ReadableStream;

  return new Response(body, { status: 200, headers });
}
