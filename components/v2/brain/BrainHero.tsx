"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrainEngine, type BrainData, type Quality } from "./engine";
import { NeuralBackdrop } from "./NeuralBackdrop";
import { LessonPlayer } from "./LessonPlayer";
import styles from "./BrainHero.module.css";

/**
 * As sete regiões da malha. Nome e função conferidos em NINDS, BrainFacts e
 * Cleveland Clinic. Num site de instituição de ensino, neurociência inventada
 * é um problema, não um detalhe. Os ids casam com `scripts/gen-brain.mjs`.
 *
 * As descrições são verbais e de comprimento variado de propósito: lista de
 * três substantivos em todas elas denuncia texto de máquina.
 */
const REGIONS = [
  { id: 0, name: "Córtex pré-frontal", short: "Pré-frontal", fn: "Planeja, decide e sustenta a atenção" },
  { id: 1, name: "Lobo frontal", short: "Frontal", fn: "Comanda o movimento voluntário e a fala" },
  { id: 2, name: "Lobo parietal", short: "Parietal", fn: "Processa tato, dor e posição do corpo" },
  { id: 3, name: "Lobo temporal", short: "Temporal", fn: "Ouve, entende a fala e forma memórias" },
  { id: 4, name: "Lobo occipital", short: "Occipital", fn: "Traduz o que os olhos veem" },
  { id: 5, name: "Cerebelo", short: "Cerebelo", fn: "Equilíbrio, postura e coordenação fina" },
  { id: 6, name: "Tronco encefálico", short: "Tronco", fn: "Respiração, batimento e ciclo do sono" },
] as const;

/** As quatro frentes de ensino. É o que a pessoa veio comprar. */
const TRACKS = [
  { href: "/cursos", name: "Cursos livres", note: "Cursos curtos, com certificado" },
  { href: "/graduacao", name: "Graduação", note: "Licenciaturas com a Unimes" },
  { href: "/pos-graduacao", name: "Pós-graduação", note: "Neurociência, psicopedagogia e gestão" },
  { href: "/eja", name: "EJA supletivo", note: "Conclua o fundamental ou o médio" },
] as const;

function pickQuality(): Quality {
  if (typeof window === "undefined") return "high";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || cores <= 4 ? "low" : "high";
}

export function BrainHero({ showHud = false }: { showHud?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BrainEngine | null>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const chipRefs = useRef(new Map<number, HTMLElement>());

  const [hovered, setHovered] = useState<number | null>(null);
  const [tagOn, setTagOn] = useState(false);
  const [fps, setFps] = useState(0);
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState({ n: 0, m: 0 });
  const [reduced, setReduced] = useState(false);

  /** Onde o fio da região ativa vai se prender, em px relativos ao canvas. */
  const syncAnchors = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;
    const cr = canvas.getBoundingClientRect();
    const anchors: { region: number; x: number; y: number }[] = [];
    for (const r of REGIONS) {
      const el = chipRefs.current.get(r.id);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      anchors.push({
        region: r.id,
        x: b.left + b.width / 2 - cr.left,
        y: b.top - cr.top,
      });
    }
    engine.setAnchors(anchors);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: BrainEngine | null = null;
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      const res = await fetch("/lab/brain.json");
      if (!res.ok) return;
      const data = (await res.json()) as BrainData;
      if (cancelled || !canvasRef.current) return;

      engine = new BrainEngine(canvasRef.current, data, pickQuality());
      engineRef.current = engine;
      setStats({ n: data.n, m: data.m });
      setReady(true);

      const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(rm.matches);

      if (rm.matches) {
        engine.renderStatic();
      } else {
        if (showHud) engine.onFps = setFps;
        engine.onHoverCluster = setHovered;

        const io = new IntersectionObserver(
          ([entry]) => {
            if (!engine) return;
            if (entry.isIntersecting && document.visibilityState === "visible") engine.start();
            else engine.stop();
          },
          { threshold: 0.05 },
        );
        io.observe(canvasRef.current);
        cleanups.push(() => io.disconnect());

        const onVis = () => {
          if (!engine) return;
          if (document.visibilityState === "visible") engine.start();
          else engine.stop();
        };
        document.addEventListener("visibilitychange", onVis);
        cleanups.push(() => document.removeEventListener("visibilitychange", onVis));
      }

      const ro = new ResizeObserver(() => {
        if (!engine) return;
        engine.resize();
        syncAnchors();
        if (rm.matches) engine.renderStatic();
      });
      ro.observe(canvasRef.current);
      cleanups.push(() => ro.disconnect());

      const mo = new MutationObserver(() => {
        if (!engine) return;
        engine.refreshTheme();
        // síncrono de propósito: a View Transition fotografa logo em seguida
        if (rm.matches) engine.renderStatic();
        else engine.repaint();
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      cleanups.push(() => mo.disconnect());

      syncAnchors();
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      engine?.dispose();
      engineRef.current = null;
    };
  }, [showHud, syncAnchors]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    engine.pointerMove(x, y);
    setTagOn(true);
    const tag = tagRef.current;
    if (tag) tag.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const onPointerLeave = useCallback(() => {
    engineRef.current?.pointerLeave();
    setTagOn(false);
  }, []);

  /** Clique: cascata no cérebro mais a onda de choque atravessando o tecido. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      engineRef.current?.tap(x, y);

      const ring = ringRef.current;
      if (!ring || reduced) return;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.getAnimations().forEach((a) => a.cancel());
      ring.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.14)", opacity: 0.6 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 0 },
        ],
        { duration: 1000, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    },
    [reduced],
  );

  /**
   * Luz que acompanha o cursor. A posição vai direto no `transform`, sem passar
   * por estado do React, e quem suaviza é a transição do CSS: o navegador
   * interpola na GPU e o atraso de 260ms é o que dá a sensação de peso. Sobre
   * link ou botão ela cresce e clareia.
   */
  const onHeroMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const g = glowRef.current;
    if (!g) return;
    const r = e.currentTarget.getBoundingClientRect();
    const target = e.target as HTMLElement;
    const hot = Boolean(target.closest?.("a, button, [role='slider']"));
    g.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0) scale(${
      hot ? 1.45 : 1
    })`;
    g.dataset.on = "true";
    g.dataset.hot = String(hot);
  }, []);

  const onHeroLeave = useCallback(() => {
    const g = glowRef.current;
    if (g) g.dataset.on = "false";
  }, []);

  const focusRegion = useCallback((id: number | null) => {
    engineRef.current?.highlightCluster(id);
    setHovered(id);
    setTagOn(false);
  }, []);

  const active = hovered == null ? null : REGIONS.find((r) => r.id === hovered);

  return (
    <div className={styles.hero} onPointerMove={onHeroMove} onPointerLeave={onHeroLeave}>
      <NeuralBackdrop />
      <span ref={glowRef} className={styles.glow} data-on="false" aria-hidden="true" />

      <div className={styles.inner}>
        {/* esquerda: o que a pessoa veio comprar */}
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Matrículas abertas para 2026
          </p>

          <h1 className={styles.title}>
            Cursos online para quem trabalha com <em>educação</em>.
          </h1>

          <p className={styles.lede}>
            A CG Educacional forma professores, psicopedagogos e gestores escolares. Você estuda
            quando dá, pelo celular ou pelo computador, e recebe certificado ao concluir.
          </p>

          <nav className={styles.tracks} aria-label="Frentes de ensino">
            {TRACKS.map((t) => (
              <Link key={t.href} href={t.href} className={styles.track}>
                <span className={styles.trackName}>{t.name}</span>
                <span className={styles.trackNote}>{t.note}</span>
                <span className={styles.trackArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link href="/cursos" className={styles.ctaPrimary}>
              Ver os cursos
            </Link>
            <Link href="/cadastro" className={styles.ctaGhost}>
              Criar minha conta
            </Link>
          </div>
        </div>

        {/* direita: a demonstração */}
        <div className={styles.showcase}>
          <div className={styles.stage} data-ready={ready}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerDown}
              role="img"
              aria-label="Cérebro humano em vista lateral, desenhado como uma rede de neurônios com impulsos percorrendo as sinapses. Sete regiões podem ser destacadas."
            />
            <span ref={ringRef} className={styles.ring} aria-hidden="true" />
            <div
              ref={tagRef}
              className={styles.tag}
              data-on={active && tagOn ? "true" : "false"}
              aria-hidden="true"
            >
              <span className={styles.tagFn}>{active?.fn}</span>
              <span className={styles.tagName}>{active?.name}</span>
            </div>
          </div>

          <nav className={styles.legend} aria-label="Regiões do cérebro">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                ref={(el) => {
                  if (el) chipRefs.current.set(r.id, el);
                  else chipRefs.current.delete(r.id);
                }}
                className={styles.chip}
                data-region={r.id}
                data-on={hovered === r.id}
                title={`${r.name}: ${r.fn}`}
                onPointerEnter={() => focusRegion(r.id)}
                onPointerLeave={() => focusRegion(null)}
                onFocus={() => focusRegion(r.id)}
                onBlur={() => focusRegion(null)}
              >
                <span className={styles.chipDot} aria-hidden="true" />
                {r.short}
              </button>
            ))}
          </nav>

          <LessonPlayer onFocusRegion={focusRegion} reduced={reduced} />
        </div>
      </div>

      {showHud && (
        <p className={styles.hud} aria-hidden="true">
          <span>{stats.n.toLocaleString("pt-BR")} neurônios</span>
          <span className={styles.hudSep}>·</span>
          <span>{stats.m.toLocaleString("pt-BR")} sinapses</span>
          <span className={styles.hudSep}>·</span>
          <span className={styles.hudFps}>{fps || "--"} fps</span>
        </p>
      )}
    </div>
  );
}
