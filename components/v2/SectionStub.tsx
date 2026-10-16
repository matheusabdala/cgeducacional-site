import styles from "./SectionStub.module.css";

/**
 * Seção ainda não construída.
 *
 * É de propósito que isto não finja conteúdo: um bloco com texto falso engana
 * quem revisa a página sobre o que já existe. Aqui aparece o nome da seção, a
 * intenção dela em uma linha e o aviso de que está pendente, para a forma da
 * página inteira ficar visível sem ninguém se iludir.
 */
export function SectionStub({
  index,
  name,
  intent,
  height = 220,
}: {
  index: string;
  name: string;
  intent: string;
  height?: number;
}) {
  return (
    <section className={styles.stub} style={{ minHeight: `${height}px` }} aria-label={name}>
      <p className={styles.meta}>
        <span className={styles.index}>{index}</span>
        <span className={styles.tag}>pendente</span>
      </p>
      <h2 className={styles.name}>{name}</h2>
      <p className={styles.intent}>{intent}</p>
    </section>
  );
}
