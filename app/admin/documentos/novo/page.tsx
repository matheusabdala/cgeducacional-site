import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, FileUp, MousePointerClick, Send } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UploadPanel } from "@/components/esign/upload-panel";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: FileUp, title: "Envie o PDF", text: "Do computador, por link ou pelo celular." },
  { icon: MousePointerClick, title: "Marque onde assinar", text: "Clique no documento para posicionar cada assinatura." },
  { icon: Send, title: "Mande o link", text: "Por e-mail, WhatsApp ou QR code no balcão." },
];

export default async function NovoDocumentoPage() {
  await requireRole(["admin"], "/admin/documentos/novo");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/documentos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Documentos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Novo documento</h1>
        <p className="mt-1 text-muted-foreground">Comece enviando o PDF que precisa ser assinado.</p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-xl border border-border bg-card/60 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Suspense>
        <UploadPanel />
      </Suspense>
    </div>
  );
}
