import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginação por querystring. Server Component: recebe os params atuais e
 * reconstrói os links preservando os filtros ativos.
 */

type Params = Record<string, string | undefined>;

/** Janela compacta de páginas em torno da atual, com reticências. */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < totalPages) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Params;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") next.set(key, value);
    }
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const items = pageWindow(page, totalPages);
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors";
  const inactive =
    "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground";
  const disabled = "border-border/50 text-muted-foreground/40";

  return (
    <nav
      className="flex items-center justify-center gap-1.5"
      aria-label="Paginação"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${base} ${inactive} gap-1`} rel="prev">
          <ChevronLeft size={15} /> Anterior
        </Link>
      ) : (
        <span className={`${base} ${disabled} gap-1`} aria-disabled="true">
          <ChevronLeft size={15} /> Anterior
        </span>
      )}

      {items.map((item, i) =>
        item === "…" ? (
          <span
            key={`gap-${i}`}
            className="px-1 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className={`${base} border-primary bg-primary/10 font-medium text-primary`}
          >
            {item}
          </span>
        ) : (
          <Link key={item} href={href(item)} className={`${base} ${inactive}`}>
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${base} ${inactive} gap-1`} rel="next">
          Próxima <ChevronRight size={15} />
        </Link>
      ) : (
        <span className={`${base} ${disabled} gap-1`} aria-disabled="true">
          Próxima <ChevronRight size={15} />
        </span>
      )}
    </nav>
  );
}
