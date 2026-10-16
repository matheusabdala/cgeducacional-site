import type { ReactNode } from "react";
import styles from "./Section.module.css";

/**
 * Faixa da página.
 *
 * O site antigo tinha seis fundos alternando branco, cinza, azul e azul escuro
 * sem critério. Aqui existem três superfícies e só:
 *
 *   base      fundo da página, o padrão
 *   sunken    rebaixada, para separar um bloco do anterior sem gritar
 *   inverted  invertida, reservada às faixas institucionais (a cor da marca)
 *
 * A invertida é cara: quanto mais aparece, menos significa. Uma por página.
 */
export function Section({
  children,
  surface = "base",
  id,
  tight = false,
}: {
  children: ReactNode;
  surface?: "base" | "sunken" | "inverted";
  id?: string;
  /** Metade do respiro vertical, para blocos que continuam o anterior. */
  tight?: boolean;
}) {
  return (
    <section id={id} className={styles.section} data-surface={surface} data-tight={tight}>
      <div className={styles.inner}>{children}</div>
    </section>
  );
}

/**
 * Cabeçalho de seção. Sempre à esquerda, sempre na mesma ordem.
 * O alinhamento alternando entre esquerda e centro era metade da bagunça.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Ação à direita do título, tipo "ver tudo". */
  aside?: ReactNode;
}) {
  return (
    <header className={styles.head}>
      <div className={styles.headText}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
        {lede && <p className={styles.lede}>{lede}</p>}
      </div>
      {aside && <div className={styles.headAside}>{aside}</div>}
    </header>
  );
}
