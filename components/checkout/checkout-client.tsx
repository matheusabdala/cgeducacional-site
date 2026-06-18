"use client";

import * as React from "react";
import Script from "next/script";
import { CreditCard, QrCode } from "lucide-react";
import { CourseCover } from "@/components/ui/course-cover";
import { CardForm, type MP } from "@/components/checkout/card-form";
import { PixPanel } from "@/components/checkout/pix-panel";
import type { CourseCategory } from "@/types";

declare global {
  interface Window {
    MercadoPago?: new (key: string, opts?: { locale?: string }) => MP;
  }
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Method = "pix" | "card";

export function CheckoutClient({
  orderId,
  courseTitle,
  courseCategory,
  courseSlug,
  basePrice,
  cardAmount,
  pixAmount,
  pixDiscount,
  pixDiscountPct,
  publicKey,
  defaultCpf,
}: {
  orderId: string;
  courseTitle: string;
  courseCategory: CourseCategory;
  courseSlug: string;
  basePrice: number;
  cardAmount: number;
  pixAmount: number;
  pixDiscount: number;
  pixDiscountPct: number;
  publicKey: string;
  defaultCpf?: string;
}) {
  const [method, setMethod] = React.useState<Method>("pix");
  const [mp, setMp] = React.useState<MP | null>(null);

  function initMp() {
    if (publicKey && window.MercadoPago && !mp) {
      setMp(new window.MercadoPago(publicKey, { locale: "pt-BR" }));
    }
  }

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={initMp}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Pagamento */}
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Forma de pagamento
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
              <button
                type="button"
                onClick={() => setMethod("pix")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  method === "pix"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode size={16} /> PIX
                {pixDiscountPct > 0 && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      method === "pix"
                        ? "bg-primary-foreground/20"
                        : "bg-teal/15 text-teal"
                    }`}
                  >
                    -{pixDiscountPct}%
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  method === "card"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard size={16} /> Cartão
              </button>
            </div>

            {method === "pix" ? (
              <PixPanel
                orderId={orderId}
                amount={pixAmount}
                discount={pixDiscount}
                courseSlug={courseSlug}
                defaultCpf={defaultCpf}
              />
            ) : !publicKey ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                Pagamento por cartão indisponível (configuração pendente). Use o
                PIX ou tente mais tarde.
              </p>
            ) : (
              <CardForm
                mp={mp}
                orderId={orderId}
                amount={cardAmount}
                courseSlug={courseSlug}
                defaultCpf={defaultCpf}
              />
            )}
          </div>
        </div>

        {/* Resumo */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24">
            <div className="mb-4 overflow-hidden rounded-xl">
              <CourseCover category={courseCategory} className="aspect-video w-full" iconSize={40} />
            </div>
            <h3 className="font-semibold leading-snug text-foreground">{courseTitle}</h3>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Preço</span>
                <span>{brl(basePrice)}</span>
              </div>
              {method === "pix" && pixDiscount > 0 && (
                <div className="flex justify-between text-teal">
                  <span>Desconto PIX ({pixDiscountPct}%)</span>
                  <span>- {brl(pixDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <span>Total</span>
                <span>{brl(method === "pix" ? pixAmount : cardAmount)}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Acesso vitalício + certificado. Garantia de 7 dias.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
