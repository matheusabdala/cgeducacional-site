"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCpf, cleanCpf, isValidCpf } from "@/lib/cpf";
import { payWithPix, getOrderStatus } from "@/app/checkout/[courseId]/actions";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PixPanel({
  orderId,
  amount,
  discount,
  courseSlug,
  defaultCpf,
}: {
  orderId: string;
  amount: number;
  discount: number;
  courseSlug: string;
  defaultCpf?: string;
}) {
  const router = useRouter();
  const [cpf, setCpf] = React.useState(defaultCpf ? formatCpf(defaultCpf) : "");
  const [generating, setGenerating] = React.useState(false);
  const [qr, setQr] = React.useState<{ code?: string; base64?: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [paid, setPaid] = React.useState(false);

  // Polling do status enquanto o QR está visível.
  React.useEffect(() => {
    if (!qr || paid) return;
    const t = setInterval(async () => {
      const res = await getOrderStatus(orderId);
      if (res.status === "approved") {
        clearInterval(t);
        setPaid(true);
        toast.success("PIX confirmado! Liberando seu acesso…");
        router.push(`/aprender/${res.slug ?? courseSlug}`);
        router.refresh();
      }
    }, 4000);
    return () => clearInterval(t);
  }, [qr, paid, orderId, courseSlug, router]);

  async function generate() {
    if (!isValidCpf(cpf)) {
      toast.error("CPF inválido");
      return;
    }
    setGenerating(true);
    const res = await payWithPix({ orderId, cpf: cleanCpf(cpf) });
    setGenerating(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setQr({ code: res.qrCode, base64: res.qrCodeBase64 });
  }

  async function copy() {
    if (!qr?.code) return;
    await navigator.clipboard.writeText(qr.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!qr) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 text-sm">
          <span className="font-semibold text-teal">PIX com desconto</span> —
          você paga <strong>{brl(amount)}</strong>
          {discount > 0 && (
            <span className="text-muted-foreground">
              {" "}
              (economia de {brl(discount)})
            </span>
          )}
          .
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pixCpf">CPF do pagador</Label>
          <Input
            id="pixCpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
          />
        </div>
        <Button
          onClick={generate}
          size="lg"
          variant="glow"
          className="w-full"
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PIX…
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-4 w-4" /> Gerar PIX de {brl(amount)}
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      {qr.base64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${qr.base64}`}
          alt="QR Code do PIX"
          className="mx-auto h-56 w-56 rounded-xl border border-border bg-white p-2"
        />
      ) : (
        <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-xl border border-border">
          <QrCode className="text-muted-foreground" size={48} />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Escaneie o QR no app do seu banco ou use o copia-e-cola. Valor:{" "}
        <strong className="text-foreground">{brl(amount)}</strong>.
      </p>

      {qr.code && (
        <div className="flex items-center gap-2">
          <Input readOnly value={qr.code} className="font-mono text-xs" />
          <Button type="button" variant="outline" onClick={copy} className="shrink-0">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Aguardando confirmação do
        pagamento…
      </div>
    </div>
  );
}
