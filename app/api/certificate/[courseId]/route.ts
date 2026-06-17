import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { certimaker } from "@/server/certimaker/client";

export const dynamic = "force-dynamic";

/**
 * Proxy do PDF do certificado. O aluno autentica no LMS; o LMS busca o PDF no
 * Certimaker com a API key e repassa. `?inline=1` abre no navegador.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";

  const user = await getAuthUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const cert = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { code: true },
  });
  if (!cert?.code) return new Response("Certificado não encontrado", { status: 404 });

  try {
    const res = await certimaker.fetchPdf(cert.code);
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="certificado-${cert.code}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Falha ao obter o certificado", { status: 502 });
  }
}
