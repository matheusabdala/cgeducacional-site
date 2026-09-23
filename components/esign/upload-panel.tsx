"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FileUp, Link2, Loader2, QrCode, Smartphone, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postFormWithProgress } from "@/lib/upload";
import { cn } from "@/lib/utils";
import {
  createFromUrlAction,
  createPhoneUploadAction,
  phoneUploadStatusAction,
} from "@/app/admin/documentos/actions";
import { QrBox } from "./qr-box";

const MAX_MB = 25;
const WORD_RE = /\.(docx?|odt|rtf)$/i;

/** Valida no navegador antes de subir (o servidor revalida tudo). */
function checkFile(file: File): string | null {
  if (WORD_RE.test(file.name)) {
    return "Arquivos do Word ainda não são aceitos. Converta para PDF antes de enviar (Word chega em breve).";
  }
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return "Envie um arquivo PDF.";
  if (file.size > MAX_MB * 1024 * 1024) return `O arquivo passa de ${MAX_MB} MB.`;
  return null;
}

export function UploadPanel() {
  const router = useRouter();
  const search = useSearchParams();
  const [tab, setTab] = React.useState("computer");
  const [pct, setPct] = React.useState<number | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);

  const upload = React.useCallback(
    async (file: File, source = "upload") => {
      const problem = checkFile(file);
      if (problem) {
        setError(problem);
        return;
      }
      setError(null);
      setFileName(file.name);
      setPct(0);
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("source", source);
        const res = await postFormWithProgress<{ id: string }>("/api/esign/upload", body, setPct);
        toast.success("PDF recebido. Agora marque onde cada pessoa assina.");
        router.push(`/admin/documentos/${res.id}`);
      } catch (e) {
        setPct(null);
        setError(e instanceof Error ? e.message : "Falha no envio");
      }
    },
    [router],
  );

  // Arquivo recebido pelo "Compartilhar" do celular (PWA / WhatsApp).
  const sharedId = search.get("compartilhado");
  const shareHandled = React.useRef(false);
  React.useEffect(() => {
    if (!sharedId || shareHandled.current) return;
    shareHandled.current = true;
    (async () => {
      try {
        const cache = await caches.open("esign-share");
        const metaRes = await cache.match(`/_share/${sharedId}/meta`);
        if (!metaRes) {
          setError("Não encontramos o arquivo compartilhado. Compartilhe de novo.");
          return;
        }
        const meta = (await metaRes.json()) as { fileName?: string; type?: string; url?: string; text?: string };
        const fileRes = await cache.match(`/_share/${sharedId}/file`);
        await cache.delete(`/_share/${sharedId}/meta`);
        if (fileRes) {
          const blob = await fileRes.blob();
          await cache.delete(`/_share/${sharedId}/file`);
          await upload(new File([blob], meta.fileName || "documento.pdf", { type: meta.type || blob.type }), "compartilhado");
          return;
        }
        const link = meta.url || meta.text?.match(/https?:\/\/\S+/)?.[0];
        if (link) {
          setTab("url");
          setUrl(link);
          setError(null);
        } else {
          setError("O compartilhamento não trouxe um PDF.");
        }
      } catch {
        setError("Não foi possível ler o arquivo compartilhado.");
      }
    })();
  }, [sharedId, upload]);

  React.useEffect(() => {
    if (search.get("erro") === "compartilhamento") {
      setError("Para compartilhar do WhatsApp, instale o app do painel (menu do usuário → Instalar app) e tente de novo.");
    }
  }, [search]);

  // --- Link ---
  async function importUrl(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setError(null);
    const res = await createFromUrlAction(url.trim());
    setImporting(false);
    if (res.error || !res.id) {
      setError(res.error ?? "Falha ao importar");
      return;
    }
    toast.success("PDF importado.");
    router.push(`/admin/documentos/${res.id}`);
  }

  const uploading = pct !== null;
  const onPhoneReceived = React.useCallback((id: string) => router.push(`/admin/documentos/${id}`), [router]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="computer" className="gap-1.5">
            <FileUp size={15} /> <span className="hidden sm:inline">Do</span> computador
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-1.5">
            <Link2 size={15} /> Por link
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-1.5">
            <Smartphone size={15} /> <span className="hidden sm:inline">Pelo</span> celular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="computer" className="mt-5">
          <Dropzone disabled={uploading} onFile={(f) => upload(f)} />
          {uploading && (
            <div className="mt-4 space-y-1.5" aria-live="polite">
              <div className="flex justify-between text-sm">
                <span className="truncate text-foreground">{fileName}</span>
                <span className="tabular-nums text-muted-foreground">{pct === 100 ? "Processando…" : `${pct}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-150" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="mt-5">
          <form onSubmit={importUrl} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pdf-url">Link do PDF</Label>
              <Input
                id="pdf-url"
                type="url"
                inputMode="url"
                placeholder="https://…/contrato.pdf"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                O link precisa ser público. Links do Google Drive e Dropbox são convertidos automaticamente.
              </p>
            </div>
            <Button type="submit" disabled={importing || !url.trim()}>
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />} Importar PDF
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="phone" className="mt-5">
          <PhoneUpload onReceived={onPhoneReceived} />
        </TabsContent>
      </Tabs>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Dropzone({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && !disabled) onFile(f);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/40",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <UploadCloud size={28} />
      </div>
      <div>
        <p className="font-medium text-foreground">Arraste o PDF aqui ou clique para escolher</p>
        <p className="mt-1 text-sm text-muted-foreground">Somente PDF · até {MAX_MB} MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PhoneUpload({ onReceived }: { onReceived: (id: string) => void }) {
  const [session, setSession] = React.useState<{ code: string; url: string; qr: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function generate() {
    setLoading(true);
    const res = await createPhoneUploadAction();
    setLoading(false);
    if (res.error || !res.code) {
      toast.error(res.error ?? "Falha ao gerar o QR code");
      return;
    }
    setSession({ code: res.code, url: res.url!, qr: res.qr!, expiresAt: res.expiresAt! });
  }

  React.useEffect(() => {
    if (!session) return;
    const t = setInterval(async () => {
      const res = await phoneUploadStatusAction(session.code);
      if (res.status === "received" && res.documentId) {
        clearInterval(t);
        toast.success("Arquivo recebido do celular!");
        onReceived(res.documentId);
      }
      if (res.status === "expired") clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
  }, [session, onReceived]);

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QrCode size={28} />
        </div>
        <div className="max-w-sm">
          <p className="font-medium text-foreground">O arquivo está no seu celular?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere um QR code, aponte a câmera do celular e escolha o PDF (por exemplo, um que você salvou do WhatsApp).
            Não precisa fazer login no celular.
          </p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />} Gerar QR code
        </Button>
      </div>
    );
  }
  return (
    <QrBox
      qr={session.qr}
      url={session.url}
      expiresAt={session.expiresAt}
      waitingText="Aguardando o arquivo do celular…"
      onRegenerate={generate}
    />
  );
}
