/**
 * Fundo ambiente em camadas (assinatura do prompt-design):
 *   1. gradiente radial de base   2. grade técnica sutil
 *   3. blobs de luz flutuantes (glow do acento CG)
 * Fixo atrás de todo o conteúdo, sem capturar cliques. Sutil no claro,
 * mais presente no escuro. Server component (sem interatividade).
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Layer 1 — gradiente radial de base (profundidade vertical) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--background))_0%,hsl(var(--background))_60%,hsl(var(--background))_100%)] dark:bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_55%,#020203_100%)]" />

      {/* Layer 2 — grade técnica */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Layer 3 — blobs de luz flutuantes */}
      <div className="absolute -top-40 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[rgb(var(--glow))] opacity-[0.10] blur-[150px] animate-float dark:opacity-[0.18]" />
      <div className="absolute top-1/3 -left-40 h-[600px] w-[600px] rounded-full bg-teal opacity-[0.06] blur-[130px] animate-float-slow dark:opacity-[0.10]" />
      <div className="absolute bottom-0 -right-32 h-[500px] w-[700px] rounded-full bg-[rgb(var(--glow))] opacity-[0.07] blur-[120px] animate-float dark:opacity-[0.12]" />
    </div>
  );
}
