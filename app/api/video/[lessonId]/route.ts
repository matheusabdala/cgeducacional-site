import { Readable } from "node:stream";
import { getAuthUser } from "@/lib/auth";
import { getLessonForUser } from "@/lib/access";
import { getStorageProvider } from "@/server/media";

export const dynamic = "force-dynamic";

/**
 * Proxy de stream de vídeo do Drive. Valida matrícula antes de servir e
 * encaminha o header Range (seeking → 206). YouTube não passa por aqui (o
 * player toca direto pelo videoId).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;

  const user = await getAuthUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const lesson = await getLessonForUser(lessonId, user.id);
  if (!lesson) return new Response("Sem acesso", { status: 403 });

  if (lesson.videoProvider !== "drive" || !lesson.videoRef) {
    return new Response("Vídeo indisponível", { status: 404 });
  }

  const range = request.headers.get("range") ?? undefined;
  const file = await getStorageProvider().getStream(lesson.videoRef, range);

  const headers = new Headers({
    "Content-Type": file.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });
  if (file.contentLength != null) {
    headers.set("Content-Length", String(file.contentLength));
  }
  if (file.contentRange) headers.set("Content-Range", file.contentRange);

  const body = Readable.toWeb(
    file.stream as Readable,
  ) as unknown as ReadableStream;

  return new Response(body, { status: file.status, headers });
}
