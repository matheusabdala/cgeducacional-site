import "server-only";
import { assertApiKey, EsignError, errorMessage, type EsignContext } from "@/server/esign";
import { metaFromHeaders } from "@/lib/request-meta";

/** Resposta de PDF sem cache e sem indexação. */
export function pdfResponse(bytes: Buffer, fileName: string, download: boolean) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/**
 * Wrapper da REST /api/esign/v1: valida a API key (Bearer), monta o contexto
 * (ator "api" + IP/UA) e converte EsignError em status HTTP + { error, code }.
 */
export function apiHandler<P>(
  fn: (req: Request, ctx: EsignContext & { actor: { id: string; name: string } }, params: P) => Promise<Response | unknown>,
) {
  return async (req: Request, route: { params: Promise<P> }) => {
    try {
      assertApiKey(req.headers.get("authorization"));
      const ctx = {
        // Documentos criados pela API ficam em nome de um ator técnico.
        actor: { id: "00000000-0000-0000-0000-000000000000", name: "API" },
        ...metaFromHeaders(req.headers),
      };
      const out = await fn(req, ctx, await route.params);
      return out instanceof Response ? out : Response.json(out);
    } catch (e) {
      if (e instanceof EsignError) {
        return Response.json({ error: e.message, code: e.code }, { status: e.status });
      }
      return Response.json({ error: errorMessage(e), code: "internal" }, { status: 500 });
    }
  };
}
