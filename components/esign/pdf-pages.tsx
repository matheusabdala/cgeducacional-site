"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Worker do pdf.js — precisa ser configurado no MESMO módulo que usa <Document>.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PDF_OPTIONS = {
  cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export type PageBox = { x: number; y: number; w: number; h: number; rotate: 0 | 90 | 180 | 270 };

export function displayAspect(box: PageBox | undefined): number {
  if (!box) return 1.414;
  const rotated = box.rotate === 90 || box.rotate === 270;
  return rotated ? box.w / box.h : box.h / box.w;
}

/**
 * Renderiza as páginas de um PDF (react-pdf) com uma camada por cima de cada
 * página para campos/destaques. Só desenha as páginas perto da tela.
 */
export function PdfPages({
  url,
  pageSizes,
  maxWidth = 820,
  renderOverlay,
  onPageClick,
  pageClassName,
  showPageNumbers = true,
}: {
  url: string;
  pageSizes: PageBox[];
  maxWidth?: number;
  renderOverlay?: (page: number) => React.ReactNode;
  onPageClick?: (page: number, relX: number, relY: number) => void;
  pageClassName?: string;
  showPageNumbers?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.min(maxWidth, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  return (
    <div ref={containerRef} className="w-full">
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
          <AlertTriangle className="text-amber-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
            Abrir o PDF em outra aba
          </a>
        </div>
      ) : width > 0 ? (
        <Document
          // Sem Suspense: usamos os estados próprios (loading/erro) deste componente.
          // Com Suspense, o boundary mais próximo (next/dynamic) remontava a árvore em loop.
          suspense={false}
          file={url}
          options={PDF_OPTIONS}
          loading={null}
          onLoadSuccess={() => setLoaded(true)}
          onLoadError={() => setError("Não foi possível exibir o documento aqui.")}
          className="flex flex-col items-center gap-5"
        >
          {pageSizes.map((box, i) => (
            <LazyPage
              key={i}
              index={i}
              width={width}
              aspect={displayAspect(box)}
              total={pageSizes.length}
              ready={loaded}
              overlay={renderOverlay?.(i)}
              onClick={onPageClick}
              className={pageClassName}
              showNumber={showPageNumbers}
            />
          ))}
        </Document>
      ) : null}
      {!loaded && !error && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando documento…
        </div>
      )}
    </div>
  );
}

function LazyPage({
  index,
  width,
  aspect,
  total,
  ready,
  overlay,
  onClick,
  className,
  showNumber,
}: {
  index: number;
  width: number;
  aspect: number;
  total: number;
  ready: boolean;
  overlay?: React.ReactNode;
  onClick?: (page: number, relX: number, relY: number) => void;
  className?: string;
  showNumber: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(index < 2);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const height = Math.round(width * aspect);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        ref={ref}
        data-page={index}
        className={cn(
          "relative overflow-hidden rounded-md bg-white shadow-card ring-1 ring-black/5",
          className,
        )}
        style={{ width, height }}
        onClick={(e) => {
          if (!onClick) return;
          const rect = e.currentTarget.getBoundingClientRect();
          onClick(index, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
        }}
      >
        {visible && ready && (
          <Page
            pageIndex={index}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<div className="h-full w-full animate-pulse bg-muted/40" />}
          />
        )}
        {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
      </div>
      {showNumber && (
        <span className="text-xs tabular-nums text-muted-foreground">
          Página {index + 1} de {total}
        </span>
      )}
    </div>
  );
}
