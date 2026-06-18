"use client";

import { brandLabel, type CardBrand } from "@/lib/card";

type Props = {
  number: string; // string já formatada (com espaços)
  name: string;
  expiry: string; // "MM/AA"
  cvv: string;
  brand: CardBrand;
  flipped: boolean; // vira pra trás ao focar o CVV
};

/** Grupos de •••• preenchidos conforme o usuário digita. */
function masked(formatted: string, brand: CardBrand): string {
  const groups = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
  const digits = formatted.replace(/\D/g, "");
  let idx = 0;
  return groups
    .map((g) => {
      const part = digits.slice(idx, idx + g);
      idx += g;
      return (part + "•".repeat(g)).slice(0, g);
    })
    .join(" ");
}

export function CardPreview({ number, name, expiry, cvv, brand, flipped }: Props) {
  return (
    <div className="mx-auto w-full max-w-[340px] [perspective:1200px]">
      <div
        className="relative h-[210px] w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Frente */}
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-cg-700 via-cg-600 to-teal p-5 text-white shadow-xl [backface-visibility:hidden]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/5" />

          <div className="flex items-start justify-between">
            <div className="h-9 w-12 rounded-md bg-gradient-to-br from-yellow-200/90 to-yellow-400/80 shadow-inner" />
            <span className="text-sm font-bold tracking-wide drop-shadow">
              {brandLabel(brand) || "••••"}
            </span>
          </div>

          <div className="font-mono text-xl tabular-nums tracking-[0.12em] drop-shadow">
            {masked(number, brand)}
          </div>

          <div className="flex items-end justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="text-[10px] uppercase opacity-70">Titular</div>
              <div className="truncate font-medium uppercase tracking-wide">
                {name || "NOME NO CARTÃO"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase opacity-70">Validade</div>
              <div className="font-medium tabular-nums">{expiry || "MM/AA"}</div>
            </div>
          </div>
        </div>

        {/* Verso */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-cg-800 via-cg-700 to-cg-600 text-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="mt-5 h-10 w-full bg-black/70" />
          <div className="mt-5 px-5">
            <div className="mb-1 text-right text-[10px] uppercase opacity-70">
              CVV
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 flex-1 rounded bg-white/80" />
              <div className="flex h-9 min-w-[56px] items-center justify-end rounded bg-white px-3 font-mono text-base tabular-nums text-gray-900">
                {cvv || "•••"}
              </div>
            </div>
            <div className="mt-6 text-right text-xs font-semibold tracking-wide opacity-80">
              {brandLabel(brand)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
