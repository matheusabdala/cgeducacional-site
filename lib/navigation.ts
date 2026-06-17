/** Mapa de navegação: ids legados (do site Vite) → rotas reais do App Router. */
export const ROUTES: Record<string, string> = {
  home: "/",
  courses: "/cursos",
  eja: "/eja",
  graduation: "/graduacao",
  postgraduation: "/pos-graduacao",
  certificate: "/validar-certificado",
};

export const NAV_ITEMS = [
  { id: "home", label: "Início", href: "/" },
  { id: "courses", label: "Cursos Livres", href: "/cursos" },
  { id: "eja", label: "EJA Supletivo", href: "/eja" },
  { id: "graduation", label: "Graduação", href: "/graduacao" },
  { id: "postgraduation", label: "Pós-Graduação", href: "/pos-graduacao" },
] as const;

export function routeFor(pageId: string): string {
  return ROUTES[pageId] ?? "/";
}
