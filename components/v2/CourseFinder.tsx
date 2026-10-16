"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import Link from "next/link";
import { AREAS, LEVELS, type AreaKey, type FinderCourse } from "@/lib/v2/areas";
import { SALES_OPEN, SALES_SOON } from "@/lib/sales";
import styles from "./CourseFinder.module.css";

/**
 * Buscador do catálogo.
 *
 * O catálogo inteiro vem com a página e o filtro roda no cliente, então a
 * contagem responde na mesma tecla que você digita. Sem rota, sem espera, sem
 * estado de carregamento.
 *
 * As áreas e as contagens saem do banco, não de uma lista escrita à mão: se
 * alguém publicar um curso novo ou arrumar uma categoria, aparece aqui sozinho.
 */

const BANDS = [
  { id: "curto", label: "Até 40h", test: (h: number | null) => h != null && h <= 40 },
  { id: "medio", label: "40h a 120h", test: (h: number | null) => h != null && h > 40 && h <= 120 },
  { id: "longo", label: "Mais de 120h", test: (h: number | null) => h != null && h > 120 },
] as const;

type BandId = (typeof BANDS)[number]["id"];

/** Sem acento e em minúscula: ninguém digita "história" com o acento certo. */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CourseFinder({ courses }: { courses: FinderCourse[] }) {
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<Set<AreaKey>>(new Set());
  const [bands, setBands] = useState<Set<BandId>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const searchId = useId();

  // digitar não deve travar a lista: o React rende o resultado em segundo plano
  const deferred = useDeferredValue(query);

  const folded = useMemo(
    () => courses.map((c) => ({ course: c, haystack: fold(c.title) })),
    [courses],
  );

  const results = useMemo(() => {
    const q = fold(deferred.trim());
    const terms = q ? q.split(/\s+/) : [];
    return folded
      .filter(({ course, haystack }) => {
        if (terms.length && !terms.every((t) => haystack.includes(t))) return false;
        if (areas.size && !areas.has(course.area)) return false;
        if (bands.size) {
          const band = BANDS.find((b) => b.test(course.hours));
          if (!band || !bands.has(band.id)) return false;
        }
        return true;
      })
      .map((f) => f.course);
  }, [folded, deferred, areas, bands]);

  /** Contagem por área sobre o resultado atual, para o chip mostrar o que sobra. */
  const areaCounts = useMemo(() => {
    const base = courses.filter((c) => {
      const q = fold(deferred.trim());
      const terms = q ? q.split(/\s+/) : [];
      if (terms.length && !terms.every((t) => fold(c.title).includes(t))) return false;
      if (bands.size) {
        const band = BANDS.find((b) => b.test(c.hours));
        if (!band || !bands.has(band.id)) return false;
      }
      return true;
    });
    const map = new Map<AreaKey, number>();
    for (const c of base) map.set(c.area, (map.get(c.area) ?? 0) + 1);
    return map;
  }, [courses, deferred, bands]);

  const orderedAreas = useMemo(
    () =>
      (Object.keys(AREAS) as AreaKey[])
        .map((key) => ({ key, count: areaCounts.get(key) ?? 0 }))
        .filter((a) => a.count > 0 || areas.has(a.key))
        .sort((a, b) => b.count - a.count),
    [areaCounts, areas],
  );

  const toggle = <T,>(set: Set<T>, value: T, apply: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    apply(next);
    setShowAll(false);
  };

  const clear = () => {
    setQuery("");
    setAreas(new Set());
    setBands(new Set());
    setShowAll(false);
  };

  const filtering = query.trim() !== "" || areas.size > 0 || bands.size > 0;
  const shown = showAll ? results : results.slice(0, 12);
  const drafts = results.filter((c) => !c.live).length;

  return (
    <section className={styles.finder} aria-labelledby="finder-title">
      <header className={styles.head}>
        <h2 id="finder-title" className={styles.title}>
          Encontre seu curso
        </h2>
        <p className={styles.lede}>
          Busque pelo nome ou filtre por área e carga horária. A contagem muda enquanto
          você escolhe.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            id={searchId}
            className={styles.search}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAll(false);
            }}
            placeholder="Digite o que você procura"
            aria-label="Buscar curso pelo nome"
            autoComplete="off"
          />
        </div>

        <p className={styles.count} aria-live="polite">
          <strong className={styles.countNum}>{results.length}</strong>{" "}
          {results.length === 1 ? "curso" : "cursos"}
          {filtering && (
            <button type="button" className={styles.clear} onClick={clear}>
              limpar
            </button>
          )}
        </p>
      </div>

      <div className={styles.filters}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Área</legend>
          <div className={styles.chips}>
            {orderedAreas.map(({ key, count }) => (
              <button
                key={key}
                type="button"
                className={styles.chip}
                data-on={areas.has(key)}
                aria-pressed={areas.has(key)}
                onClick={() => toggle(areas, key, setAreas)}
              >
                {AREAS[key]}
                <span className={styles.chipCount}>{count}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Carga horária</legend>
          <div className={styles.chips}>
            {BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={styles.chip}
                data-on={bands.has(b.id)}
                aria-pressed={bands.has(b.id)}
                onClick={() => toggle(bands, b.id, setBands)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>
          Nenhum curso com esses filtros. Tente outra palavra ou tire um dos filtros.
        </p>
      ) : (
        <>
          <ul className={styles.list}>
            {shown.map((c) => {
              // Curso não publicado não tem página: `/cursos/[id]` busca só os
              // publicados e devolve 404. Então o card dele não é link.
              const body = (
                <>
                  <span className={styles.cardArea}>{AREAS[c.area]}</span>
                  <span className={styles.cardTitle}>{c.title}</span>
                  <span className={styles.cardMeta}>
                    {c.hours ? `${c.hours}h` : "carga a definir"}
                    <span className={styles.dot} aria-hidden="true">
                      ·
                    </span>
                    {LEVELS[c.level]}
                    {!c.live ? (
                      <span className={styles.tag}>Em preparação</span>
                    ) : (
                      !SALES_OPEN && <span className={styles.tag}>{SALES_SOON}</span>
                    )}
                  </span>
                </>
              );
              return (
                <li key={c.id}>
                  {c.live ? (
                    <Link href={`/cursos/${c.id}`} className={styles.card}>
                      {body}
                    </Link>
                  ) : (
                    <div className={styles.card} data-draft="true">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {results.length > shown.length && (
            <button type="button" className={styles.more} onClick={() => setShowAll(true)}>
              Ver os outros {results.length - shown.length}
            </button>
          )}
        </>
      )}

      {drafts > 0 && (
        <p className={styles.note}>
          {drafts} destes {drafts === 1 ? "ainda está" : "ainda estão"} em preparação e não
          {drafts === 1 ? " aparece" : " aparecem"} no site publicado.
        </p>
      )}
    </section>
  );
}
