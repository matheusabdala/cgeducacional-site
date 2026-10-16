import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Action.module.css";

/**
 * Hierarquia de ação, e é esta a lista inteira:
 *
 *   primary    um por tela. Azul institucional.
 *   secondary  contorno. Para a alternativa.
 *   quiet      link de texto com seta. Para "ver tudo", "saiba mais".
 *
 * O site antigo tinha três cores brigando pelo papel de principal (azul, teal
 * e contorno), então nada se destacava. O teal passa a ser acento, nunca botão
 * primário.
 */
export function Action({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  external = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet";
  size?: "md" | "lg";
  external?: boolean;
}) {
  const className = styles[variant];
  const props = { className, "data-size": size };

  if (href && external) {
    return (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
        {children}
        {variant === "quiet" && <Arrow />}
      </a>
    );
  }
  if (href) {
    return (
      <Link {...props} href={href}>
        {children}
        {variant === "quiet" && <Arrow />}
      </Link>
    );
  }
  return (
    <button {...props} type="button" onClick={onClick}>
      {children}
      {variant === "quiet" && <Arrow />}
    </button>
  );
}

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
