import Link from "next/link";
import { FilePlus2, FileSignature, SearchX } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listDocuments } from "@/server/esign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/admin/pagination";
import { DocumentStatusBadge, STATUS_FILTERS } from "@/components/esign/document-status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { filter?: string; q?: string; page?: string };

const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default async function DocumentosPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireRole(["admin"], "/admin/documentos");
  const params = await searchParams;
  const filter = params.filter ?? "";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { rows, total, totalPages, byStatus } = await listDocuments({ filter, q, page });
  const isFiltered = Boolean(filter || q);
  const allCount = Object.values(byStatus).reduce((a, b) => a + (b ?? 0), 0);

  const chipHref = (value: string) => {
    const sp = new URLSearchParams();
    if (value) sp.set("filter", value);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/admin/documentos?${s}` : "/admin/documentos";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documentos</h1>
          <p className="mt-1 text-muted-foreground">Envie PDFs para assinatura eletrônica e acompanhe quem já assinou.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/documentos/novo">
            <FilePlus2 size={18} /> Novo documento
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-2" aria-label="Filtrar por situação">
          {STATUS_FILTERS.map((f) => {
            const count = f.value ? byStatus[f.value as keyof typeof byStatus] ?? 0 : allCount;
            const activeChip = filter === f.value;
            return (
              <Link
                key={f.value || "all"}
                href={chipHref(f.value)}
                aria-current={activeChip ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
                  activeChip
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                {f.label}
                <span className="tabular-nums text-xs opacity-70">{count}</span>
              </Link>
            );
          })}
        </nav>
        <form method="GET" className="flex gap-2 md:w-80">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <Input name="q" defaultValue={q} placeholder="Buscar por título, código ou pessoa…" aria-label="Buscar documentos" />
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isFiltered ? <SearchX size={28} /> : <FileSignature size={28} />}
          </div>
          <div>
            <p className="font-medium text-foreground">{isFiltered ? "Nenhum documento encontrado" : "Nenhum documento ainda"}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {isFiltered
                ? "Tente outro filtro ou termo de busca."
                : "Envie um PDF, marque onde cada pessoa assina e mande o link. O documento assinado volta pra cá sozinho."}
            </p>
          </div>
          {isFiltered ? (
            <Button asChild variant="outline">
              <Link href="/admin/documentos">Limpar filtros</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/admin/documentos/novo">
                <FilePlus2 size={18} /> Enviar o primeiro documento
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {rows.map((d) => {
              const signed = d.signers.filter((s) => s.status === "signed").length;
              const names = d.signers.map((s, i) => s.signedName ?? s.name ?? `Signatário ${i + 1}`);
              return (
                <li key={d.id}>
                  <Link
                    href={`/admin/documentos/${d.id}`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/40 sm:px-5"
                  >
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                      <FileSignature size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{d.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{d.code}</span>
                        {names.length > 0 && <> · {names.join(", ")}</>}
                      </p>
                    </div>
                    <div className="hidden text-right text-sm sm:block">
                      {d.status !== "draft" && d.signers.length > 0 && (
                        <p className="tabular-nums text-foreground">
                          {signed}/{d.signers.length} assinaram
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{fmt(d.completedAt ?? d.sentAt ?? d.createdAt)}</p>
                    </div>
                    <DocumentStatusBadge status={d.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination page={page} totalPages={totalPages} basePath="/admin/documentos" params={params} />
        </>
      )}
    </div>
  );
}
