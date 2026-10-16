"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LessonPlayer.module.css";

/**
 * Player de aula — interativo, sem vídeo.
 *
 * A ideia que sustenta o hero: a aula e o cérebro são o mesmo objeto. Cada
 * capítulo fala de uma região, e percorrer a linha do tempo acende a região
 * correspondente lá em cima. Não é um player decorativo ao lado de um gráfico:
 * é a aula atravessando o cérebro.
 *
 * Nada aqui carrega mídia. O tempo é simulado, acelerado, e o estado inteiro
 * cabe em dois números.
 */

export type Chapter = {
  id: string;
  title: string;
  region: number;
  from: number; // segundos de aula
  to: number;
};

export const CHAPTERS: Chapter[] = [
  { id: "c1", title: "Atenção e funções executivas", region: 0, from: 0, to: 420 },
  { id: "c2", title: "Como a memória se forma", region: 3, from: 420, to: 960 },
  { id: "c3", title: "O caminho da leitura no cérebro", region: 4, from: 960, to: 1440 },
  { id: "c4", title: "Números e noção de espaço", region: 2, from: 1440, to: 1860 },
  { id: "c5", title: "Linguagem e fala", region: 1, from: 1860, to: 2220 },
  { id: "c6", title: "Por que a prática vira automatismo", region: 5, from: 2220, to: 2880 },
];

const TOTAL = CHAPTERS[CHAPTERS.length - 1].to;
const SPEED = 70; // segundos de aula por segundo real — é uma demonstração

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

const chapterAt = (t: number) =>
  CHAPTERS.find((c) => t >= c.from && t < c.to) ?? CHAPTERS[CHAPTERS.length - 1];

export function LessonPlayer({
  onFocusRegion,
  reduced,
}: {
  /** Região a acender no cérebro. null solta o destaque. */
  onFocusRegion: (region: number | null) => void;
  reduced: boolean;
}) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<Chapter | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  const current = chapterAt(time);

  // o cérebro segue o capítulo sob o cursor; na falta dele, o que está tocando
  useEffect(() => {
    if (hover) onFocusRegion(hover.region);
    else if (playing) onFocusRegion(current.region);
    else onFocusRegion(null);
  }, [hover, playing, current.region, onFocusRegion]);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = 0;
    const step = (now: number) => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;
      setTime((t) => {
        const next = t + dt * SPEED;
        if (next >= TOTAL) {
          setPlaying(false);
          return TOTAL;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const seekFromPointer = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setTime(ratio * TOTAL);
  }, []);

  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromPointer(e.clientX);
  };
  const onTrackMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) seekFromPointer(e.clientX);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setTime((t) => Math.min(TOTAL, t + 60));
    else if (e.key === "ArrowLeft") setTime((t) => Math.max(0, t - 60));
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setPlaying((p) => !p);
    } else return;
    e.preventDefault();
  };

  return (
    <section className={styles.player} aria-label="Aula demonstrativa">
      <header className={styles.head}>
        <span className={styles.badge}>aula demonstrativa</span>
        <h2 className={styles.title}>Neurociência da Aprendizagem</h2>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span className={styles.module}>Módulo 2</span>
      </header>

      <div className={styles.row}>
        <button
          type="button"
          className={styles.play}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pausar a aula" : "Reproduzir a aula"}
          disabled={reduced}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="4" y="3" width="3" height="10" rx="1" />
              <rect x="9" y="3" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5 3.4v9.2a.6.6 0 0 0 .92.5l7.2-4.6a.6.6 0 0 0 0-1L5.92 2.9A.6.6 0 0 0 5 3.4Z" />
            </svg>
          )}
        </button>

        <div className={styles.trackWrap}>
          <div
            ref={trackRef}
            className={styles.track}
            onPointerDown={onTrackDown}
            onPointerMove={onTrackMove}
            onKeyDown={onKey}
            role="slider"
            tabIndex={0}
            aria-label="Posição na aula"
            aria-valuemin={0}
            aria-valuemax={TOTAL}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${clock(time)}, ${current.title}`}
          >
            {CHAPTERS.map((c) => (
              <span
                key={c.id}
                className={styles.seg}
                data-region={c.region}
                data-on={c === current}
                style={{
                  left: `${(c.from / TOTAL) * 100}%`,
                  width: `${((c.to - c.from) / TOTAL) * 100}%`,
                }}
                onPointerEnter={() => setHover(c)}
                onPointerLeave={() => setHover(null)}
              >
                <span
                  className={styles.segFill}
                  style={{
                    transform: `scaleX(${Math.min(
                      1,
                      Math.max(0, (time - c.from) / (c.to - c.from)),
                    )})`,
                  }}
                />
              </span>
            ))}
            <span
              className={styles.head_}
              style={{ left: `${(time / TOTAL) * 100}%` }}
              aria-hidden="true"
            />
          </div>

          <p className={styles.meta}>
            <span className={styles.chapter} data-region={current.region}>
              {current.title}
            </span>
            <span className={styles.time}>
              {clock(time)} <span className={styles.dim}>/ {clock(TOTAL)}</span>
            </span>
          </p>
        </div>
      </div>

      <ol className={styles.list}>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className={styles.item}
              data-region={c.region}
              data-on={c === current}
              onClick={() => setTime(c.from)}
              onPointerEnter={() => setHover(c)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(c)}
              onBlur={() => setHover(null)}
            >
              <span className={styles.itemNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.itemTitle}>{c.title}</span>
              <span className={styles.itemTime}>{clock(c.to - c.from)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
