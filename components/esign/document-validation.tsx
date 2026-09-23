"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileQuestion,
  Hash,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateDocumentAction, type DocumentValidation } from "@/app/(marketing)/validar-documento/actions";

const fmt = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Campo_Grande" }) : "—";

const STATUS = {
  completed: { label: "Assinado por todos", icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  pending: { label: "Aguardando assinaturas", icon: Clock, cls: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
  cancelled: { label: "Cancelado", icon: XCircle, cls: "text-red-600 dark:text-red-400 bg-red-500/10" },
  draft: { label: "Rascunho", icon: Clock, cls: "text-muted-foreground bg-secondary" },
} as const;

async function sha256OfFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function DocumentValidationPage() {
  const search = useSearchParams();
  const [code, setCode] = React.useState(search.get("codigo") ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<DocumentValidation | null>(null);

  const run = React.useCallback(async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await validateDocumentAction(value);
    setLoading(false);
    if (res.error || !res.result) setError(res.error ?? "Documento não encontrado.");
    else setResult(res.result);
  }, []);

  // Veio pelo QR do relatório: valida sozinho.
  const auto = React.useRef(false);
  React.useEffect(() => {
    const c = search.get("codigo");
    if (c && !auto.current) {
      auto.current = true;
      void run(c);
    }
  }, [search, run]);

  return (
    <div className="min-h-screen bg-secondary/30">
      <section className="relative overflow-hidden bg-gradient-to-br from-cg-800 to-cg-950 py-16 text-white">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-teal-500/20 p-3 ring-1 ring-teal-400/30">
            <ShieldCheck size={32} className="text-teal-300" />
          </div>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">Validar documento assinado</h1>
          <p className="mx-auto max-w-2xl text-lg text-cg-100">
            Confira se um documento foi assinado eletronicamente pela CG Educacional. Informe o código que aparece no
            relatório de assinaturas (ex.: DOC-7K3M-Q2ZP).
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-10 px-4 pb-16">
        <div className="container mx-auto max-w-2xl space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(code);
            }}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card sm:flex-row sm:p-8"
          >
            <div className="relative flex-1">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Código do documento"
                className="h-12 pl-10 font-mono text-base uppercase"
                placeholder="DOC-XXXX-XXXX"
                value={code}
                spellCheck={false}
                autoCapitalize="characters"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button type="submit" size="lg" className="h-12" disabled={loading || !code.trim()}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Validar
            </Button>
          </form>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
              <AlertCircle className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">{error}</p>
                <p className="mt-1 text-sm text-muted-foreground">Confira se digitou o código exatamente como no documento.</p>
              </div>
            </div>
          )}

          {result && <ResultCard r={result} />}
        </div>
      </section>
    </div>
  );
}

function ResultCard({ r }: { r: DocumentValidation }) {
  const s = STATUS[r.status];
  const Icon = s.icon;
  const [check, setCheck] = React.useState<"idle" | "loading" | "signed" | "original" | "mismatch">("idle");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function verify(file: File) {
    setCheck("loading");
    const h = await sha256OfFile(file);
    setCheck(h === r.signedSha256 ? "signed" : h === r.originalSha256 ? "original" : "mismatch");
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm text-muted-foreground">{r.code}</p>
          <h2 className="text-pretty text-xl font-semibold text-foreground">{r.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {r.pageCount} página(s) · enviado em {fmt(r.sentAt)}
          </p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", s.cls)}>
          <Icon size={16} /> {s.label}
        </span>
      </div>

      {r.completedAt && (
        <p className="text-sm text-foreground">
          Concluído em <strong>{fmt(r.completedAt)}</strong>.
        </p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Assinaturas</h3>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {r.signers.map((sg, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-foreground">
                {sg.name}
                {sg.cpf && <span className="text-muted-foreground"> · CPF {sg.cpf}</span>}
              </span>
              <span className={sg.status === "signed" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                {sg.status === "signed" ? `Assinou em ${fmt(sg.signedAt)}` : "Pendente"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-medium text-foreground">Conferir um arquivo</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha o PDF que você recebeu. A conferência é feita no seu navegador — o arquivo não é enviado.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={check === "loading"}>
            {check === "loading" ? <Loader2 size={15} className="animate-spin" /> : <FileQuestion size={15} />} Escolher PDF
          </Button>
          {check === "signed" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <FileCheck2 size={16} /> Confere: é a versão assinada mais recente.
            </span>
          )}
          {check === "original" && (
            <span className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <FileCheck2 size={16} /> É o arquivo original, ainda sem as assinaturas.
            </span>
          )}
          {check === "mismatch" && (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircle size={16} /> Não confere. O arquivo é diferente ou é uma versão anterior.
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void verify(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
