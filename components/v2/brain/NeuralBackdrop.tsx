"use client";

import { useEffect, useRef } from "react";
import styles from "./NeuralBackdrop.module.css";

/**
 * Fundo de tecido neural.
 *
 * Em vez dos três blobs desfocados de praxe, aqui o fundo é uma lâmina de
 * dendritos: traços que se ramificam a partir de corpos celulares, como numa
 * preparação histológica. Desenhado UMA vez por redimensionamento — não há
 * loop, então custa zero por frame; a vida vem de uma deriva lenta em
 * `transform`, que o compositor resolve na GPU.
 */

type Ctx = CanvasRenderingContext2D;

/** Um dendrito: segmento, bifurcação, repete. O afinamento é o que dá o ar
 *  orgânico — ramo que não afina lê como teia de aranha. */
function branch(
  ctx: Ctx,
  x: number,
  y: number,
  angle: number,
  len: number,
  width: number,
  depth: number,
  rnd: () => number,
  tips: [number, number][],
) {
  if (depth <= 0 || len < 4) {
    tips.push([x, y]);
    return;
  }
  // leve curvatura: dendrito reto denuncia que é código
  const bend = (rnd() - 0.5) * 0.5;
  const mx = x + Math.cos(angle) * len * 0.5;
  const my = y + Math.sin(angle) * len * 0.5;
  const ex = x + Math.cos(angle + bend) * len;
  const ey = y + Math.sin(angle + bend) * len;

  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.stroke();

  const forks = rnd() < 0.72 ? 2 : 1;
  for (let i = 0; i < forks; i++) {
    const spread = (i === 0 ? -1 : 1) * (0.32 + rnd() * 0.5);
    branch(
      ctx,
      ex,
      ey,
      angle + bend + (forks === 1 ? (rnd() - 0.5) * 0.6 : spread),
      len * (0.62 + rnd() * 0.18),
      width * 0.68,
      depth - 1,
      rnd,
      tips,
    );
  }
}

function paint(canvas: HTMLCanvasElement, host: HTMLElement) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 2 || h < 2) return;

  const dpr = Math.min(1.75, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cs = getComputedStyle(host);
  const ink = cs.getPropertyValue("--backdrop-ink").trim() || "120 140 200";
  const strength = parseFloat(cs.getPropertyValue("--backdrop-strength")) || 1;

  // gerador próprio: o desenho precisa ser o mesmo entre repaints do mesmo
  // tamanho, senão o fundo "pisca" diferente a cada resize
  let seed = 991;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  ctx.lineCap = "round";
  const seeds = Math.round((w * h) / 38000);
  const tips: [number, number][] = [];

  for (let i = 0; i < seeds; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    // mais fraco no miolo da tela: ali mora o conteúdo
    const dx = (x - w / 2) / (w / 2);
    const dy = (y - h / 2) / (h / 2);
    const edge = Math.min(1, Math.hypot(dx, dy) * 0.85 + 0.18);
    const a = 0.062 * edge * strength;

    ctx.strokeStyle = `rgba(${ink.replace(/\s+/g, ",")},${a.toFixed(3)})`;
    const arms = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < arms; k++) {
      branch(ctx, x, y, rnd() * Math.PI * 2, 34 + rnd() * 46, 1.5, 4, rnd, tips);
    }
    // corpo celular
    ctx.fillStyle = `rgba(${ink.replace(/\s+/g, ",")},${(a * 2.6).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + rnd() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // botões sinápticos nas pontas
  ctx.fillStyle = `rgba(${ink.replace(/\s+/g, ",")},${(0.05 * strength).toFixed(3)})`;
  for (const [x, y] of tips) {
    ctx.beginPath();
    ctx.arc(x, y, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function NeuralBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let timer = 0;
    const repaint = () => paint(canvas, host);
    repaint();

    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(repaint, 160);
    });
    ro.observe(canvas);

    // o tema é CSS; aqui só repintamos quando a classe muda
    const mo = new MutationObserver(repaint);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} className={styles.backdrop} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.vignette} />
    </div>
  );
}
