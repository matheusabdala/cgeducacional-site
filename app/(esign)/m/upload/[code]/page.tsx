import { peekUploadSession } from "@/server/esign";
import { PhoneUploadForm } from "@/components/esign/phone-upload-form";
import { PhoneMessage } from "@/components/esign/phone-message";

export const dynamic = "force-dynamic";

/** Aberta pelo QR do painel: o operador escolhe o PDF que está no celular. */
export default async function UploadCelularPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await peekUploadSession(code).catch(() => ({ status: "expired" as const }));
  if (s.status === "used") {
    return <PhoneMessage kind="ok" title="Arquivo já enviado" text="O documento já apareceu no computador." />;
  }
  if (s.status !== "open") {
    return <PhoneMessage kind="error" title="QR code expirado" text="Gere um novo QR code no painel, em Documentos → Novo." />;
  }
  return <PhoneUploadForm code={code} actorName={s.actorName} />;
}
