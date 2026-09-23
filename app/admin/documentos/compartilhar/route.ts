/**
 * Destino do "Compartilhar" do PWA (share_target). Normalmente o service worker
 * intercepta o POST antes de chegar aqui; se chegou, o app não está instalado
 * ou o SW ainda não ativou → volta para "Novo documento" com um aviso.
 */
export function POST(request: Request) {
  return Response.redirect(new URL("/admin/documentos/novo?erro=compartilhamento", request.url), 303);
}

export function GET(request: Request) {
  return Response.redirect(new URL("/admin/documentos/novo", request.url), 303);
}
