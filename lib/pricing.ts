import { serverEnv } from "@/lib/env";

export type PaymentMethodChoice = "pix" | "credit_card";

export type PriceBreakdown = {
  base: number; // preço do curso
  discount: number; // desconto aplicado (ex.: PIX)
  total: number; // valor a cobrar
  discountPct: number; // % de desconto aplicado
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula o valor a cobrar conforme o método. PIX recebe o desconto configurado
 * em `MERCADOPAGO_PIX_DISCOUNT` (% , default 2). **Sempre** chamado no servidor a
 * partir do preço do curso no banco — nunca confiar em valor vindo do cliente.
 */
export function computeAmount(
  coursePrice: number,
  method: PaymentMethodChoice,
): PriceBreakdown {
  const base = round2(coursePrice);
  const pct = method === "pix" ? serverEnv.pixDiscountPct() : 0;
  const discount = round2(base * (pct / 100));
  const total = round2(base - discount);
  return { base, discount, total, discountPct: pct };
}
