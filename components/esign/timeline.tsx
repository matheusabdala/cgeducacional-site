import {
  CheckCircle2,
  Eye,
  FilePlus2,
  FileText,
  KeyRound,
  Mail,
  PenLine,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { formatDateTime } from "@/server/esign";

type Event = {
  id: string;
  type: string;
  signerId: string | null;
  ip: string | null;
  data: unknown;
  createdAt: Date;
};

const ICON: Record<string, React.ElementType> = {
  document_created: FilePlus2,
  sent: Send,
  email_sent: Mail,
  link_opened: Eye,
  otp_sent: KeyRound,
  otp_verified: KeyRound,
  phone_session_created: Smartphone,
  phone_signature_received: Smartphone,
  signer_signed: PenLine,
  pdf_rendered: FileText,
  completed: CheckCircle2,
  cancelled: XCircle,
  link_rotated: RefreshCw,
  otp_waived: KeyRound,
};

function describe(e: Event, signerName: (id: string | null) => string): { title: string; detail?: string } {
  const d = (e.data ?? {}) as Record<string, unknown>;
  const who = signerName(e.signerId);
  switch (e.type) {
    case "document_created":
      return { title: `Documento criado por ${d.by ?? "—"}`, detail: `${d.file ?? ""} · ${d.pages ?? "?"} página(s) · via ${d.source ?? "upload"}` };
    case "sent":
      return { title: "Enviado para assinatura", detail: Array.isArray(d.signers) ? (d.signers as string[]).join(", ") : undefined };
    case "email_sent":
      if (d.skipped) return { title: `E-mail para ${who} não enviado`, detail: "Serviço de e-mail desligado — envie o link manualmente." };
      if (d.ok === false) return { title: `Falha ao enviar o convite por e-mail para ${who}`, detail: `${d.to ?? ""} · envie o link pelo WhatsApp` };
      return { title: `Convite enviado por e-mail para ${who}`, detail: String(d.to ?? "") };
    case "link_opened":
      return { title: `${who} abriu o link`, detail: String(d.device ?? "") };
    case "otp_sent":
      if (d.ok === false) return { title: `Falha ao enviar o código de verificação para ${who}`, detail: `${d.to ?? ""} · e-mail indisponível` };
      return { title: `Código de verificação enviado para ${who}`, detail: String(d.to ?? "") };
    case "otp_verified":
      return { title: `${who} confirmou o código do e-mail`, detail: String(d.email ?? "") };
    case "phone_session_created":
      return { title: `${who} gerou um QR code para assinar no celular` };
    case "phone_signature_received":
      return { title: "Assinatura desenhada no celular recebida", detail: String(d.device ?? "") };
    case "signer_signed":
      return {
        title: `${d.name ?? who} assinou`,
        detail: [d.cpf, d.device, d.phoneDevice ? `celular: ${d.phoneDevice}` : null].filter(Boolean).join(" · "),
      };
    case "pdf_rendered":
      return { title: `PDF assinado atualizado (versão ${d.version ?? "?"})`, detail: `${d.signed}/${d.total} assinaturas` };
    case "completed":
      return { title: "Documento concluído — todas as assinaturas coletadas" };
    case "cancelled":
      return { title: `Documento cancelado por ${d.by ?? "—"}` };
    case "otp_waived":
      return { title: `Código por e-mail dispensado por ${d.by ?? "—"}` };
    case "link_rotated":
      return { title: `Novo link gerado para ${who}` };
    default:
      return { title: e.type };
  }
}

export function Timeline({
  events,
  signerName,
  integrity,
}: {
  events: Event[];
  signerName: (id: string | null) => string;
  integrity: { ok: boolean; count: number };
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">Histórico</h2>
        {integrity.ok ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400" title="A cadeia de hash dos eventos confere">
            <ShieldCheck size={14} /> Registro íntegro
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
            <ShieldAlert size={14} /> Registro alterado
          </span>
        )}
      </div>
      <ol className="relative space-y-4 border-l border-border pl-5">
        {[...events].reverse().map((e) => {
          const Icon = ICON[e.type] ?? FileText;
          const { title, detail } = describe(e, signerName);
          return (
            <li key={e.id} className="relative">
              <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                <Icon size={11} />
              </span>
              <p className="text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(e.createdAt)}
                {e.ip ? ` · IP ${e.ip}` : ""}
                {detail ? ` · ${detail}` : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
