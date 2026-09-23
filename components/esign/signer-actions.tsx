"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2, Mail, MessageCircle, MoreHorizontal, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSignerLinkAction,
  resendInviteAction,
  rotateSignerLinkAction,
} from "@/app/admin/documentos/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { copyText } from "@/lib/clipboard";

/** Ações do operador para um signatário que ainda não assinou. */
export function SignerActions({
  signerId,
  documentId,
  name,
  email,
  docTitle,
}: {
  signerId: string;
  documentId: string;
  name: string | null;
  email: string | null;
  docTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  // Diálogo com o link (e QR, se houver): usado no "QR" e quando a cópia falha.
  const [qr, setQr] = React.useState<{ link: string; img?: string } | null>(null);

  async function link(): Promise<string | null> {
    const res = await getSignerLinkAction(signerId);
    if (res.error || !res.link) {
      toast.error(res.error ?? "Link indisponível");
      return null;
    }
    return res.link;
  }

  async function copy() {
    const l = await link();
    if (!l) return;
    if (await copyText(l)) toast.success("Link copiado");
    else setQr({ link: l });
  }

  async function whatsapp() {
    // Abre a janela já no clique (bloqueio de pop-up) e preenche depois.
    const win = window.open("", "_blank");
    const l = await link();
    if (!l) {
      win?.close();
      return;
    }
    const text = `Olá${name ? `, ${name.split(" ")[0]}` : ""}! Segue o documento "${docTitle}" da CG Educacional para você assinar eletronicamente (leva menos de 2 minutos): ${l}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (win) win.location.href = url;
    else window.location.href = url;
  }

  async function showQr() {
    const l = await link();
    if (!l) return;
    const QRCode = (await import("qrcode")).default;
    setQr({ link: l, img: await QRCode.toDataURL(l, { margin: 1, width: 360 }) });
  }

  async function resend() {
    setBusy(true);
    const res = await resendInviteAction(signerId, documentId);
    setBusy(false);
    if (res.error) toast.error(res.error);
    else if (res.skipped) toast.warning("O serviço de e-mail está desligado. Copie o link e envie pelo WhatsApp.");
    else toast.success("Convite reenviado por e-mail");
    router.refresh();
  }

  async function rotate() {
    const res = await rotateSignerLinkAction(signerId, documentId);
    if (res.error || !res.link) {
      toast.error(res.error ?? "Falha ao gerar link");
      return;
    }
    if (await copyText(res.link)) toast.success("Novo link gerado e copiado. O anterior deixou de funcionar.");
    else setQr({ link: res.link });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={copy}>
        <Copy size={15} /> Copiar link
      </Button>
      <Button size="sm" variant="outline" onClick={whatsapp}>
        <MessageCircle size={15} /> WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={showQr}>
        <QrCode size={15} /> QR
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" aria-label="Mais ações" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!email} onSelect={() => void resend()}>
            <Mail size={15} /> Reenviar e-mail
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ConfirmButton
            title="Gerar um novo link?"
            description="O link atual deixa de funcionar. Use se o link foi enviado para a pessoa errada."
            confirmLabel="Gerar novo link"
            onConfirm={rotate}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <RefreshCw size={15} /> Gerar novo link
            </DropdownMenuItem>
          </ConfirmButton>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{qr?.img ? "Assinar pelo celular" : "Link de assinatura"}</DialogTitle>
            <DialogDescription>
              {qr?.img
                ? `Peça para ${name?.split(" ")[0] || "a pessoa"} apontar a câmera do celular para o código.`
                : "Copie o link abaixo e envie para a pessoa."}
            </DialogDescription>
          </DialogHeader>
          {qr?.img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr.img} alt="QR code do link de assinatura" className="mx-auto h-64 w-64 rounded-2xl border border-border bg-white p-2" />
          )}
          {qr && (
            <input
              readOnly
              value={qr.link}
              aria-label="Link de assinatura"
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-xs"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
