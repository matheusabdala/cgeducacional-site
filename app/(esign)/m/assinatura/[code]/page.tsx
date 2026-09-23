import { peekSignatureSession } from "@/server/esign";
import { PhonePad } from "@/components/esign/phone-pad";
import { PhoneMessage } from "@/components/esign/phone-message";

export const dynamic = "force-dynamic";

/** Aberta pelo QR code: tela branca só com o campo de assinatura. */
export default async function AssinaturaCelularPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await peekSignatureSession(code).catch(() => ({ status: "expired" as const }));
  if (s.status === "used") {
    return <PhoneMessage kind="ok" title="Assinatura já enviada" text="Volte para a outra tela para concluir." />;
  }
  if (s.status !== "open") {
    return (
      <PhoneMessage
        kind="error"
        title="QR code expirado"
        text="Gere um novo QR code na tela onde você está assinando o documento."
      />
    );
  }
  return <PhonePad code={code} title={s.title} />;
}
