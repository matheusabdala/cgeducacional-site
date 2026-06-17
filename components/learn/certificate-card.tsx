"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Award, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCpf } from "@/lib/cpf";
import { issueCertificate, setCpf } from "@/app/aprender/certificate-actions";

export function CertificateCard({
  courseId,
  initialCode,
  initialPdfUrl,
  hasCpf,
}: {
  courseId: string;
  initialCode: string | null;
  initialPdfUrl: string | null;
  hasCpf: boolean;
}) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = React.useState(initialPdfUrl);
  const [needCpf, setNeedCpf] = React.useState(!hasCpf);
  const [cpf, setCpfValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function emit() {
    setBusy(true);
    try {
      if (needCpf) {
        const r = await setCpf(cpf);
        if (r.error) {
          toast.error(r.error);
          return;
        }
        setNeedCpf(false);
      }
      const r = await issueCertificate(courseId);
      if (r.needsCpf) {
        setNeedCpf(true);
        toast.error(r.error ?? "Informe seu CPF.");
        return;
      }
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setPdfUrl(r.pdfUrl ?? null);
      toast.success("Certificado emitido! 🎉");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal/30 bg-teal/5 p-6 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
          <Award size={24} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {pdfUrl ? (
            <>
              <div>
                <h3 className="font-semibold text-foreground">
                  Seu certificado está pronto!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Parabéns por concluir o curso.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="teal">
                    <Download size={18} /> Baixar certificado
                  </Button>
                </a>
                <a
                  href={`${pdfUrl}?inline=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <ExternalLink size={18} /> Visualizar
                  </Button>
                </a>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-foreground">
                  Curso concluído! 🎉
                </h3>
                <p className="text-sm text-muted-foreground">
                  Emita seu certificado de conclusão.
                </p>
              </div>

              {needCpf && (
                <div className="space-y-1.5">
                  <Label htmlFor="cpf-cert">
                    Confirme seu CPF (vai no certificado)
                  </Label>
                  <Input
                    id="cpf-cert"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpfValue(formatCpf(e.target.value))}
                    className="max-w-xs"
                  />
                </div>
              )}

              <Button variant="teal" onClick={emit} disabled={busy}>
                <Award size={18} />
                {busy ? "Emitindo…" : "Emitir certificado"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
