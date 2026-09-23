/*
 * Service worker do painel CG Educacional (PWA).
 * Única responsabilidade: receber arquivos do "Compartilhar" do celular
 * (Web Share Target — ex.: PDF recebido no WhatsApp) e entregá-los à tela
 * "Novo documento". NÃO faz cache de páginas (evita servir versão antiga).
 */
const SHARE_CACHE = "esign-share";
const SHARE_PATH = "/admin/documentos/compartilhar";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === SHARE_PATH) {
    event.respondWith(handleShare(event.request));
  }
});

async function handleShare(request) {
  const origin = self.location.origin;
  try {
    const form = await request.formData();
    const id = self.crypto.randomUUID();
    const cache = await caches.open(SHARE_CACHE);
    const file = form.getAll("files").find((f) => f && typeof f !== "string");
    const meta = {
      title: form.get("title") || "",
      text: form.get("text") || "",
      url: form.get("url") || "",
      fileName: file ? file.name : null,
      type: file ? file.type : null,
      at: Date.now(),
    };
    if (file) {
      await cache.put(
        `/_share/${id}/file`,
        new Response(file, { headers: { "Content-Type": file.type || "application/pdf" } }),
      );
    }
    await cache.put(
      `/_share/${id}/meta`,
      new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json" } }),
    );
    return Response.redirect(`${origin}/admin/documentos/novo?compartilhado=${id}`, 303);
  } catch (e) {
    return Response.redirect(`${origin}/admin/documentos/novo?erro=compartilhamento`, 303);
  }
}
