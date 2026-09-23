"use client";

import * as React from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";
import { submitPhoneSignatureAction } from "@/app/(esign)/m/actions";
import { SignatureCanvas, type SignaturePadHandle } from "./sign/signature-pad";
import { PhoneMessage } from "./phone-message";

/** Página branca do celular: só o campo de assinatura e dois botões. */
export function PhonePad({ code, title }: { code: string; title: string }) {
  const padRef = React.useRef<SignaturePadHandle>(null);
  const [hasInk, setHasInk] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    const png = padRef.current?.toPng();
    if (!png) return;
    setSending(true);
    setError(null);
    const res = await submitPhoneSignatureAction(code, png);
    setSending(false);
    if (res.error) setError(res.error);
    else setDone(true);
  }

  if (done) {
    return <PhoneMessage kind="ok" title="Assinatura enviada" text="Pronto! Volte para a outra tela para confirmar e concluir." />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 [padding-bottom:env(safe-area-inset-bottom)]">
      <header className="px-5 pb-2 pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">CG Educacional</p>
        <h1 className="mt-1 text-lg font-semibold leading-snug">Assine com o dedo no campo abaixo</h1>
        <p className="mt-0.5 truncate text-sm text-slate-500">{title}</p>
      </header>
      <div className="flex-1 px-4">
        <SignatureCanvas ref={padRef} onChange={setHasInk} tall />
        <p className="-mt-1 text-center text-xs text-slate-400">Dica: gire o celular para ter mais espaço.</p>
      </div>
      {error && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-3 p-4">
        <button
          type="button"
          onClick={() => padRef.current?.clear()}
          disabled={!hasInk || sending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-base font-medium text-slate-700 disabled:opacity-40"
        >
          <RotateCcw size={18} /> Limpar
        </button>
        <button
          type="button"
          onClick={send}
          disabled={!hasInk || sending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2A4DC0] text-base font-semibold text-white disabled:opacity-40"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Enviar
        </button>
      </div>
    </div>
  );
}
