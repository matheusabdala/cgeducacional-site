"use client";

import * as React from "react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/** QR code + link copiável + contagem regressiva até expirar. */
export function QrBox({
  qr,
  url,
  expiresAt,
  waitingText,
  onRegenerate,
}: {
  qr: string;
  url: string;
  expiresAt: string;
  waitingText: string;
  onRegenerate: () => void;
}) {
  const [left, setLeft] = React.useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now())), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const expired = left <= 0;
  const mm = Math.floor(left / 60000);
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  async function copy() {
    if (!(await copyText(url))) return; // o campo ao lado já mostra o link selecionável
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt="QR code"
          width={224}
          height={224}
          className={`h-56 w-56 rounded-2xl border border-border bg-white p-2 transition-opacity ${expired ? "opacity-20" : ""}`}
        />
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={onRegenerate}>
              <RefreshCw size={16} /> Gerar novo QR
            </Button>
          </div>
        )}
      </div>
      {!expired && (
        <>
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Loader2 size={15} className="animate-spin" /> {waitingText}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            Expira em {mm}:{ss}
          </p>
        </>
      )}
      <div className="flex w-full max-w-sm items-center gap-2">
        <input
          readOnly
          value={url}
          aria-label="Link"
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-xs text-muted-foreground"
        />
        <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
