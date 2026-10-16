/**
 * Trava de vendas.
 *
 * Todos os cursos estão em revisão geral, então nenhum pode ser comprado por
 * enquanto. Isto é uma chave só, consumida pela vitrine, pela página do curso e
 * pela própria rota de checkout. Espalhar a condição pela UI deixaria o
 * checkout acessível por link direto, que é o caminho que importa fechar.
 *
 * Para reabrir, defina `NEXT_PUBLIC_SALES_OPEN=true` no Coolify. É build arg
 * (como as outras `NEXT_PUBLIC_*` deste projeto), então exige um novo deploy
 * para valer.
 */
export const SALES_OPEN = process.env.NEXT_PUBLIC_SALES_OPEN === "true";

/** Texto curto para onde ficaria o botão de compra. */
export const SALES_SOON = "Em breve";

/** Uma linha explicando por que não dá para comprar agora. */
export const SALES_SOON_NOTE =
  "As matrículas abrem em breve. Os cursos estão passando por revisão.";
