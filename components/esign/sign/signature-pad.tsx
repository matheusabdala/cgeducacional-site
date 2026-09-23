"use client";

import * as React from "react";
import SignaturePad from "signature_pad";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const INK = "#0b1d51";

/** Recorta o canvas até a área desenhada (+ margem) e devolve PNG base64. */
export function trimCanvasToPng(source: HTMLCanvasElement, pad = 12): string | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let top = height,
    left = width,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad);
  bottom = Math.min(height - 1, bottom + pad);
  const out = document.createElement("canvas");
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext("2d")!.drawImage(source, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

export type SignaturePadHandle = { toPng: () => string | null; clear: () => void };

/** Área para desenhar a assinatura com mouse, caneta ou dedo. */
export const SignatureCanvas = React.forwardRef<
  SignaturePadHandle,
  { onChange?: (hasInk: boolean) => void; className?: string; tall?: boolean }
>(function SignatureCanvas({ onChange, className, tall }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const padRef = React.useRef<SignaturePad | null>(null);
  const [hasInk, setHasInk] = React.useState(false);

  const report = React.useCallback(
    (v: boolean) => {
      setHasInk(v);
      onChange?.(v);
    },
    [onChange],
  );

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const pad = new SignaturePad(canvas, {
      penColor: INK,
      minWidth: 0.9,
      maxWidth: 2.8,
      velocityFilterWeight: 0.6,
    });
    padRef.current = pad;
    const onEnd = () => report(!pad.isEmpty());
    pad.addEventListener("endStroke", onEnd);

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = pad.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);
      pad.clear();
      pad.fromData(data);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      pad.removeEventListener("endStroke", onEnd);
      pad.off();
    };
  }, [report]);

  React.useImperativeHandle(ref, () => ({
    toPng: () => (padRef.current && !padRef.current.isEmpty() ? trimCanvasToPng(canvasRef.current!) : null),
    clear: () => {
      padRef.current?.clear();
      report(false);
    },
  }));

  function undo() {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    data.pop();
    pad.fromData(data);
    report(!pad.isEmpty());
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative rounded-xl border-2 border-dashed border-border bg-white">
        <canvas
          ref={canvasRef}
          aria-label="Área para desenhar a assinatura"
          className={cn("block w-full touch-none rounded-xl", tall ? "h-[55vh] min-h-[220px]" : "h-44 sm:h-48")}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Assine aqui
          </span>
        )}
        <span className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-slate-300" aria-hidden />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={undo} disabled={!hasInk}>
          <Undo2 size={15} /> Desfazer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            padRef.current?.clear();
            report(false);
          }}
          disabled={!hasInk}
        >
          <Eraser size={15} /> Limpar
        </Button>
      </div>
    </div>
  );
});
