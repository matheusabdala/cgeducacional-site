export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "elo"
  | "hipercard"
  | "diners"
  | "discover"
  | "unknown";

/** Detecta a bandeira a partir dos dígitos iniciais (BIN). */
export function detectBrand(num: string): CardBrand {
  const n = num.replace(/\D/g, "");
  if (!n) return "unknown";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n))
    return "elo";
  if (/^(606282|3841)/.test(n)) return "hipercard";
  if (/^3(0[0-5]|[68])/.test(n)) return "diners";
  if (/^6(011|5)/.test(n)) return "discover";
  return "unknown";
}

export function brandLabel(b: CardBrand): string {
  return (
    {
      visa: "VISA",
      mastercard: "Mastercard",
      amex: "Amex",
      elo: "Elo",
      hipercard: "Hipercard",
      diners: "Diners",
      discover: "Discover",
      unknown: "",
    } satisfies Record<CardBrand, string>
  )[b];
}

export function maxCardLen(b: CardBrand): number {
  return b === "amex" ? 15 : b === "diners" ? 14 : 16;
}

export function cvvLen(b: CardBrand): number {
  return b === "amex" ? 4 : 3;
}

/** Formata com espaços (4-4-4-4, ou 4-6-5 no Amex). */
export function formatCardNumber(num: string, brand: CardBrand): string {
  const n = num.replace(/\D/g, "").slice(0, maxCardLen(brand));
  if (brand === "amex") {
    return n.replace(/(\d{1,4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" "),
    );
  }
  return n.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Valida o número do cartão via algoritmo de Luhn. */
export function luhnValid(num: string): boolean {
  const n = num.replace(/\D/g, "");
  if (n.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}
