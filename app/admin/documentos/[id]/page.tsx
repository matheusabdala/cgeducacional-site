import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { formatCpf } from "@/lib/cpf";
import {
  EsignError,
  formatDateTime,
  getDocument,
  maskEmail,
  METHOD_LABEL,
  verifyAuditChain,
  type PageBox,
} from "@/server/esign";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/esign/document-status";
import { FieldEditor } from "@/components/esign/field-editor";
import { SignerActions } from "@/components/esign/signer-actions";
import { CancelDocumentButton, DeleteDraftButton } from "@/components/esign/document-actions";
import { Timeline } from "@/components/esign/timeline";
import { AutoRefresh } from "@/components/esign/auto-refresh";
import { SIGNER_COLORS } from "@/components/esign/signer-colors";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right text-foreground">{value}</span>
    </div>
  );
}

export default async function DocumentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enviado?: string }>;
}) {
  await requireRole(["admin"], "/admin/documentos");
  const { id } = await params;
  const justSent = (await searchParams).enviado === "1";
  let doc: Awaited<ReturnType<typeof getDocument>>;
  try {
    doc = await getDocument(id);
  } catch (e) {
    if (e instanceof EsignError && e.code === "not_found") notFound();
    throw e;
  }

  const back = (
    <Link
      href="/admin/documentos"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={16} /> Documentos
    </Link>
  );

  // --- Rascunho: editor de campos -------------------------------------------------
  if (doc.status === "draft") {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          {back}
          <DeleteDraftButton id={doc.id} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Marque onde cada pessoa assina</h1>
          <DocumentStatusBadge status={doc.status} />
        </div>
        <FieldEditor
          doc={{
            id: doc.id,
            title: doc.title,
            requireOtp: doc.requireOtp,
            message: doc.message,
            pageCount: doc.pageCount,
            pageSizes: doc.pageSizes as unknown as PageBox[],
          }}
          initialSigners={doc.signers.map((s) => ({ id: s.id, name: s.name, email: s.email, cpf: s.cpf }))}
          initialFields={doc.fields.map((f) => ({ signerId: f.signerId, kind: f.kind, page: f.page, x: f.x, y: f.y, w: f.w, h: f.h }))}
        />
      </div>
    );
  }

  // --- Enviado: acompanhamento ------------------------------------------------------
  const integrity = await verifyAuditChain(doc.id, doc.events);
  const signed = doc.signers.filter((s) => s.status === "signed").length;
  const total = doc.signers.length;
  const pct = total ? Math.round((signed / total) * 100) : 0;
  const nameOf = (sid: string | null) => {
    const i = doc.signers.findIndex((s) => s.id === sid);
    if (i < 0) return "Signatário";
    const s = doc.signers[i];
    return s.signedName ?? s.name ?? `Signatário ${i + 1}`;
  };
  const previewWhich = doc.signedPath ? "signed" : "original";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {doc.status === "pending" && <AutoRefresh />}
      {back}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{doc.title}</h1>
            <DocumentStatusBadge status={doc.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{doc.code}</span> · enviado por {doc.createdByName}
            {doc.sentAt ? ` em ${formatDateTime(doc.sentAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc.signedPath && (
            <Button asChild>
              <a href={`/api/esign/files/${doc.id}/signed?download=1`}>
                <Download size={16} /> {doc.status === "completed" ? "Baixar assinado" : "Baixar parcial"}
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
            <a href={`/api/esign/files/${doc.id}/original`} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Original
            </a>
          </Button>
          {doc.status === "pending" && <CancelDocumentButton id={doc.id} />}
        </div>
      </div>

      {justSent && doc.status === "pending" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-foreground">
            <strong>Documento enviado!</strong> Agora mande o link para cada pessoa: <strong>Copiar link</strong>,{" "}
            <strong>WhatsApp</strong> ou <strong>QR</strong> (para quem está aí no balcão). Esta página atualiza o
            andamento conforme as assinaturas chegam.
          </p>
        </div>
      )}

      {/* Progresso */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-foreground">
            {doc.status === "completed" ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <Clock size={18} className="text-amber-500" />
            )}
            {doc.status === "completed"
              ? `Concluído em ${doc.completedAt ? formatDateTime(doc.completedAt) : "—"}`
              : doc.status === "cancelled"
                ? "Documento cancelado"
                : `${signed} de ${total} assinaram`}
          </span>
          <span className="tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${doc.status === "completed" ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {/* Signatários */}
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground">Signatários</h2>
            {doc.signers.map((s, i) => {
              const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
              const isSigned = s.status === "signed";
              return (
                <article key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {s.signedName ?? s.name ?? `Signatário ${i + 1}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.signedEmail ?? s.email ?? "sem e-mail"}
                          {s.cpf && !isSigned ? ` · CPF exigido ${formatCpf(s.cpf)}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isSigned
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : s.viewedAt
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {isSigned ? "Assinou" : s.viewedAt ? "Visualizou" : "Pendente"}
                    </span>
                  </div>

                  {isSigned ? (
                    <div className="mt-3 grid gap-x-6 border-t border-border pt-3 sm:grid-cols-2">
                      <Row label="Assinou em" value={s.signedAt ? formatDateTime(s.signedAt) : "—"} />
                      <Row label="CPF" value={s.signedCpf ? formatCpf(s.signedCpf) : "—"} />
                      <Row label="Tipo" value={s.signatureMethod ? METHOD_LABEL[s.signatureMethod] : "—"} />
                      <Row label="IP" value={s.signedIp ?? "—"} />
                      <Row label="Dispositivo" value={s.signedDevice ?? "—"} />
                      {s.signatureMethod === "phone" && <Row label="Celular" value={s.phoneDevice ?? "—"} />}
                      <Row
                        label="E-mail verificado"
                        value={s.otpVerifiedAt && s.otpEmail ? maskEmail(s.otpEmail) : "Não exigido"}
                      />
                    </div>
                  ) : doc.status === "pending" ? (
                    <div className="mt-4">
                      <SignerActions
                        signerId={s.id}
                        documentId={doc.id}
                        name={s.name}
                        email={s.email}
                        docTitle={doc.title}
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          {/* Pré-visualização */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
              <span className="font-medium text-foreground">
                {previewWhich === "signed" ? "Documento com assinaturas" : "Documento original"}
              </span>
              <a
                href={`/api/esign/files/${doc.id}/${previewWhich}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Abrir em tela cheia
              </a>
            </div>
            <iframe
              title="Pré-visualização do documento"
              src={`/api/esign/files/${doc.id}/${previewWhich}#view=FitH`}
              className="h-[75vh] w-full bg-white"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck size={17} className="text-primary" /> Integridade
            </h2>
            <Row label="Código" value={<span className="font-mono">{doc.code}</span>} />
            <Row label="Páginas" value={doc.pageCount} />
            <Row label="Código por e-mail" value={doc.requireOtp ? "Exigido" : "Não exigido"} />
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-muted-foreground">SHA-256 do original</p>
              <p className="break-all font-mono text-foreground">{doc.originalSha256}</p>
              {doc.signedSha256 && (
                <>
                  <p className="pt-1 text-muted-foreground">SHA-256 do assinado (v{doc.signedVersion})</p>
                  <p className="break-all font-mono text-foreground">{doc.signedSha256}</p>
                </>
              )}
            </div>
            <Link
              href={`/validar-documento?codigo=${doc.code}`}
              target="_blank"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Página pública de validação →
            </Link>
          </section>

          <Timeline events={doc.events} signerName={nameOf} integrity={integrity} />
        </div>
      </div>
    </div>
  );
}
