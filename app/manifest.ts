import type { MetadataRoute } from "next";

/**
 * PWA do painel (instalável no Chrome/Edge). O `share_target` faz o app
 * aparecer no "Compartilhar" do Android: um PDF recebido no WhatsApp vai
 * direto para "Novo documento" (o service worker em /sw.js recebe o POST).
 */
export default function manifest(): MetadataRoute.Manifest {
  const m = {
    id: "/admin",
    name: "CG Educacional — Painel",
    short_name: "CG Painel",
    description: "Painel da CG Educacional: cursos, alunos e assinatura de documentos.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#051A61",
    lang: "pt-BR",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Novo documento", url: "/admin/documentos/novo", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
      { name: "Documentos", url: "/admin/documentos", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
    ],
    share_target: {
      action: "/admin/documentos/compartilhar",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "files", accept: ["application/pdf", ".pdf"] }],
      },
    },
  };
  return m as MetadataRoute.Manifest;
}
