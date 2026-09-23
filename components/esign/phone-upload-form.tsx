"use client";

import * as React from "react";
import { FileUp, Loader2 } from "lucide-react";
import { postFormWithProgress } from "@/lib/upload";
import { PhoneMessage } from "./phone-message";

/** Página do celular para enviar um PDF ao painel (sessão do QR, sem login). */
export function PhoneUploadForm({ code, actorName }: { code: string; actorName: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pct, setPct] = React.useState<number | null>(null);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onFile(file: File) {
    setError(null);
    if (/\.(docx?|odt|rtf)$/i.test(file.name)) {
      setError("Arquivos do Word ainda não são aceitos. Converta para PDF antes (Word chega em breve).");
      return;
    }
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setError("Escolha um arquivo PDF.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("O arquivo passa de 25 MB.");
      return;
    }
    setName(file.name);
    setPct(0);
    try {
      const body = new FormData();
      body.append("file", file);
      await postFormWithProgress(`/api/esign/phone-upload/${code}`, body, setPct);
      setDone(true);
    } catch (e) {
      setPct(null);
      setError(e instanceof Error ? e.message : "Falha no envio");
    }
  }

  if (done) {
    return <PhoneMessage kind="ok" title="Arquivo enviado" text="Pronto! Continue no computador para marcar onde cada pessoa assina." />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white px-6 text-center text-slate-900">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">CG Educacional · Documentos</p>
        <h1 className="mt-2 text-xl font-semibold">Enviar PDF para o painel</h1>
        <p className="mt-1 text-sm text-slate-500">
          {actorName ? `Sessão de ${actorName}. ` : ""}O arquivo vai direto para a tela do computador.
        </p>
      </div>
      {pct === null ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 active:bg-slate-50"
        >
          <FileUp size={40} className="text-[#2A4DC0]" />
          <span className="text-base font-semibold">Escolher PDF</span>
          <span className="text-xs text-slate-500">Arquivos, Downloads ou salvos do WhatsApp · até 25 MB</span>
        </button>
      ) : (
        <div className="w-full max-w-xs space-y-2" aria-live="polite">
          <p className="truncate text-sm font-medium">{name}</p>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#2A4DC0] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 size={14} className="animate-spin" /> {pct < 100 ? `Enviando… ${pct}%` : "Processando…"}
          </p>
        </div>
      )}
      {error && <p className="max-w-xs rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
