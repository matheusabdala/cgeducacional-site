"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { cancelDocumentAction, deleteDraftAction, waiveOtpAction } from "@/app/admin/documentos/actions";

export function CancelDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      title="Cancelar este documento?"
      description="Os links param de funcionar e ninguém mais consegue assinar. As assinaturas já feitas ficam registradas."
      confirmLabel="Cancelar documento"
      onConfirm={async () => {
        const res = await cancelDocumentAction(id);
        if (res.error) toast.error(res.error);
        else {
          toast.success("Documento cancelado");
          router.refresh();
        }
      }}
    >
      <Button variant="outline" className="text-destructive hover:text-destructive">
        <Ban size={16} /> Cancelar
      </Button>
    </ConfirmButton>
  );
}

export function WaiveOtpButton({ id }: { id: string }) {
  return (
    <ConfirmButton
      title="Dispensar o código por e-mail?"
      description="Quem ainda não assinou poderá assinar só com o link pessoal (sem o código). Use se o e-mail não está chegando ou se a assinatura é presencial. A mudança fica registrada no histórico."
      confirmLabel="Dispensar código"
      onConfirm={async () => {
        const res = await waiveOtpAction(id);
        if (res.error) toast.error(res.error);
        else {
          toast.success("Código dispensado. Peça para a pessoa recarregar a página de assinatura.");
          window.location.reload();
        }
      }}
    >
      <button type="button" className="text-xs font-medium text-primary hover:underline">
        Dispensar
      </button>
    </ConfirmButton>
  );
}

export function DeleteDraftButton({ id }: { id: string }) {
  return (
    <ConfirmButton
      title="Excluir este rascunho?"
      description="O PDF e os campos posicionados serão apagados. Essa ação não pode ser desfeita."
      confirmLabel="Excluir"
      onConfirm={async () => {
        const res = await deleteDraftAction(id);
        if (res.error) toast.error(res.error);
        else {
          toast.success("Rascunho excluído");
          // Recarga completa (navegação suave logo após a action não trocava de página).
          window.location.assign("/admin/documentos");
        }
      }}
    >
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
        <Trash2 size={15} /> Excluir rascunho
      </Button>
    </ConfirmButton>
  );
}
