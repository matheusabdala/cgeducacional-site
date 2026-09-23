"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INK, trimCanvasToPng } from "./signature-pad";

/** Converte o texto em PNG na fonte cursiva (o mesmo visual do preview). */
export async function renderTypedSignature(text: string, host: HTMLElement | null): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return null;
  const family = (host ? getComputedStyle(host).fontFamily : "") || "cursive";
  const size = 110;
  try {
    await document.fonts.load(`600 ${size}px ${family}`, clean);
  } catch {
    /* usa o fallback */
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 ${size}px ${family}`;
  const w = Math.ceil(ctx.measureText(clean).width) + 60;
  canvas.width = Math.min(Math.max(w, 200), 2400);
  canvas.height = Math.round(size * 1.6);
  ctx.font = `600 ${size}px ${family}`;
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  ctx.fillText(clean, 30, canvas.height / 2);
  return trimCanvasToPng(canvas, 10);
}

export function TypedSignature({
  value,
  onChange,
  previewRef,
}: {
  value: string;
  onChange: (v: string) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="typed-sig">Digite seu nome</Label>
        <Input
          id="typed-sig"
          value={value}
          maxLength={80}
          autoComplete="name"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-white px-4 sm:h-40">
        <div
          ref={previewRef}
          className="whitespace-nowrap font-semibold"
          // Encolhe a fonte conforme o nome cresce, para caber no celular.
          style={{
            fontFamily: "var(--font-signature), cursive",
            color: INK,
            fontSize: `clamp(1.5rem, ${Math.min(13, 150 / Math.max(value.trim().length, 8))}vw, 3.75rem)`,
          }}
        >
          {value.trim() || <span className="text-base font-normal text-slate-400" style={{ fontFamily: "inherit" }}>Prévia da assinatura</span>}
        </div>
      </div>
    </div>
  );
}
