/** Tipos compartilhados do módulo de assinatura. */

/** Quem está agindo e de onde (evidência). Montado pela camada web. */
export type EsignContext = {
  actor?: { id: string; name: string };
  ip?: string | null;
  userAgent?: string | null;
};

/** Caixa de corte da página (pontos) + rotação, como o pdf.js exibe. */
export type PageBox = { x: number; y: number; w: number; h: number; rotate: 0 | 90 | 180 | 270 };

export type FieldKind = "signature" | "name" | "cpf" | "date";

/** Campo posicionado em coordenadas relativas (0..1) da página exibida. */
export type FieldRect = {
  kind: FieldKind;
  page: number; // 0-based
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Geo = { lat: number; lng: number; accuracy?: number };
