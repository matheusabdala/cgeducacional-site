"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createPhoneSignatureAction,
  phoneSignatureStatusAction,
} from "@/app/(esign)/assinar/[token]/actions";
import { QrBox } from "../qr-box";

export type PhoneResult = { sessionCode: string; dataUrl: string; device: string | null };

/**
 * Assinar com o dedo no celular: mostra QR + link; o celular abre uma página
 * branca só com o campo de assinatura; aqui fazemos polling até ela chegar.
 */
export function PhoneSignature({
  token,
  result,
  onResult,
}: {
  token: string;
  result: PhoneResult | null;
  onResult: (r: PhoneResult | null) => void;
}) {
  const [session, setSession] = React.useState<{ code: string; url: string; qr: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const generate = React.useCallback(async () => {
    setLoading(true);
    onResult(null);
    const res = await createPhoneSignatureAction(token);
    setLoading(false);
    if (res.error || !res.code) {
      toast.error(res.error ?? "Não foi possível gerar o QR code");
      return;
    }
    setSession({ code: res.code, url: res.url!, qr: res.qr!, expiresAt: res.expiresAt! });
  }, [token, onResult]);

  React.useEffect(() => {
    if (!session || result) return;
    const t = setInterval(async () => {
      const res = await phoneSignatureStatusAction(token, session.code);
      if (res.status === "received" && res.dataUrl) {
        clearInterval(t);
        onResult({ sessionCode: session.code, dataUrl: res.dataUrl, device: res.device ?? null });
        toast.success("Assinatura recebida do celular!");
      }
      if (res.status === "expired") clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
  }, [session, result, token, onResult]);

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex h-44 items-center justify-center rounded-xl border-2 border-emerald-500/40 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.dataUrl} alt="Assinatura feita no celular" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Recebida de {result.device ?? "celular"}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => void generate()}>
            <RefreshCw size={15} /> Assinar de novo
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Smartphone size={24} />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Prefere assinar com o dedo? Gere um QR code, aponte a câmera do celular e assine na tela que abrir.
        </p>
        <Button type="button" onClick={() => void generate()} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />} Gerar QR code
        </Button>
      </div>
    );
  }

  return (
    <QrBox
      qr={session.qr}
      url={session.url}
      expiresAt={session.expiresAt}
      waitingText="Aguardando a assinatura no celular…"
      onRegenerate={() => void generate()}
    />
  );
}
