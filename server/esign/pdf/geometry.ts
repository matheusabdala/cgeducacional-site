import type { PageBox } from "../types";

/**
 * Conversão entre a página EXIBIDA (como o operador viu no editor: já rotacionada,
 * origem no canto superior esquerdo, y para baixo) e o espaço do PDF (sem rotação,
 * origem no canto inferior esquerdo, y para cima).
 */

/** Largura/altura da página como é exibida (pontos). */
export function displaySize(box: PageBox): { w: number; h: number } {
  return box.rotate === 90 || box.rotate === 270 ? { w: box.h, h: box.w } : { w: box.w, h: box.h };
}

/** Ponto exibido (u,v em pontos, topo-esquerdo) → ponto no espaço do PDF. */
export function toPdfPoint(box: PageBox, u: number, v: number): { x: number; y: number } {
  const { x: x0, y: y0, w: W, h: H } = box;
  switch (box.rotate) {
    case 90:
      return { x: x0 + v, y: y0 + u };
    case 180:
      return { x: x0 + W - u, y: y0 + v };
    case 270:
      return { x: x0 + W - v, y: y0 + H - u };
    default:
      return { x: x0 + u, y: y0 + H - v };
  }
}

/** Retângulo relativo (0..1) → retângulo em pontos na página exibida. */
export function toDisplayRect(box: PageBox, r: { x: number; y: number; w: number; h: number }) {
  const d = displaySize(box);
  return { u: r.x * d.w, v: r.y * d.h, w: r.w * d.w, h: r.h * d.h };
}
