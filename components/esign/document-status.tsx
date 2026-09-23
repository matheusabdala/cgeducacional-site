import type { EsignDocumentStatus } from "@prisma/client";

const STATUS: Record<EsignDocumentStatus, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-secondary text-muted-foreground" },
  pending: { label: "Aguardando", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  completed: { label: "Assinado", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  cancelled: { label: "Cancelado", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export function DocumentStatusBadge({ status }: { status: EsignDocumentStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
  );
}

export const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Aguardando" },
  { value: "completed", label: "Assinados" },
  { value: "draft", label: "Rascunhos" },
  { value: "cancelled", label: "Cancelados" },
] as const;
