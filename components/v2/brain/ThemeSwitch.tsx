"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import styles from "./ThemeSwitch.module.css";

/**
 * Troca de tema com revelação circular saindo do próprio botão.
 *
 * Usa a View Transitions API do navegador, que é nativa: ele tira uma foto do
 * antes e do depois e nos deixa animar as duas camadas. Sem isso, a única
 * forma de fazer o mesmo seria duplicar a página inteira na mão.
 *
 * Indo para o escuro, o novo tema cresce a partir do botão. Voltando para o
 * claro, o escuro encolhe de volta para dentro dele, o que lê como desfazer e
 * não como uma segunda entrada.
 *
 * Navegador sem suporte ou pessoa com movimento reduzido trocam o tema na hora,
 * sem animação. É melhoria progressiva, não requisito.
 */

/**
 * Regras da transição, injetadas pelo componente.
 *
 * Elas precisam ser globais: `::view-transition-*` são pseudo-elementos do
 * documento, e CSS Modules recusa seletor sem classe local (tanto na forma
 * `:global(...)` quanto no bloco `:global {}`). Pôr isto no globals.css
 * resolveria, mas é arquivo compartilhado com o LMS inteiro, e estas regras só
 * interessam a quem usa este botão.
 *
 * O fade cruzado padrão do navegador é desligado para o clip-path ser o único
 * movimento. Qual das duas fotos fica por cima depende da direção, e quem
 * decide é o `data-vt` escrito na raiz logo antes da troca.
 */
const VT_CSS = `
html::view-transition-old(root),
html::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
html[data-vt="in"]::view-transition-old(root) { z-index: 1; }
html[data-vt="in"]::view-transition-new(root) { z-index: 2; }
html[data-vt="out"]::view-transition-old(root) { z-index: 2; }
html[data-vt="out"]::view-transition-new(root) { z-index: 1; }
`;

type ViewTransition = { ready: Promise<void>; finished: Promise<void> };
type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => ViewTransition;
};

export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // evita divergência de hidratação: o ícone só aparece depois de montar
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const toggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const next = isDark ? "light" : "dark";
      const doc = document as DocWithVT;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || typeof doc.startViewTransition !== "function") {
        setTheme(next);
        return;
      }

      const box = e.currentTarget.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      // raio até o canto mais distante: o círculo precisa cobrir a tela toda
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      const goingDark = next === "dark";
      const root = document.documentElement;
      // o data-attr decide qual das duas fotos fica por cima (ver o CSS)
      root.dataset.vt = goingDark ? "in" : "out";

      const transition = doc.startViewTransition(() => setTheme(next));

      transition.ready.then(() => {
        const grow = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];
        root.animate(
          { clipPath: goingDark ? grow : [...grow].reverse() },
          {
            duration: 620,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: goingDark
              ? "::view-transition-new(root)"
              : "::view-transition-old(root)",
          },
        );
      });

      transition.finished.finally(() => {
        delete root.dataset.vt;
      });
    },
    [isDark, setTheme],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: VT_CSS }} />
      <button
        type="button"
        onClick={toggle}
        className={[styles.button, className].filter(Boolean).join(" ")}
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        data-dark={isDark}
      >
        <span className={styles.icons} aria-hidden="true">
          <svg className={styles.sun} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
          </svg>
          <svg className={styles.moon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20.3 14.1A8.4 8.4 0 0 1 9.9 3.7a8.4 8.4 0 1 0 10.4 10.4Z" />
          </svg>
        </span>
      </button>
    </>
  );
}
