import { Readable } from "node:stream";
import { getAuthUser } from "@/lib/auth";
import { getLessonForUser } from "@/lib/access";
import { getStorageProvider } from "@/server/media";

export const dynamic = "force-dynamic";

/** Download de material da aula (PDF/slides). Valida matrícula antes. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;

  const user = await getAuthUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const lesson = await getLessonForUser(lessonId, user.id);
  if (!lesson) return new Response("Sem acesso", { status: 403 });

  if (!lesson.materialFileId) {
    return new Response("Material indisponível", { status: 404 });
  }

  const file = await getStorageProvider().getStream(lesson.materialFileId);

  const headers = new Headers({
    "Content-Type": file.mimeType,
    "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
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
