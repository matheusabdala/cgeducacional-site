import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { ESIGN } from "@/server/esign/config";

// Fonte da assinatura digitada (renderizada em canvas → PNG).
const signatureFont = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-signature",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Assinatura de documento — CG Educacional",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Layout mínimo das páginas públicas de assinatura (sem menu do site). */
export default function EsignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${signatureFont.variable} flex min-h-screen flex-col`}>
      <div className="flex-1">{children}</div>
      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
        {ESIGN.company.name} · CNPJ {ESIGN.company.cnpj} · Assinatura eletrônica com validade jurídica (MP
        2.200-2/2001 e Lei 14.063/2020)
      </footer>
    </div>
  );
}
