import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo oficial da CG Educacional (PNGs em public/brand/). Troca marinho ↔ branco
 * via classe `dark` — sem JS, então não causa mismatch de hidratação.
 *   mark    → só o símbolo "CG" (cabeçalhos; texto fica ao lado, em HTML)
 *   stacked → símbolo + "CG Educacional" embaixo (login, rodapé)
 */
const VARIANTS = {
  mark: { src: "logo-mark", width: 879, height: 415 },
  stacked: { src: "logo", width: 972, height: 578 },
} as const;

export function BrandLogo({
  variant = "mark",
  className,
  sizes,
  priority,
}: {
  variant?: keyof typeof VARIANTS;
  /** Altura via Tailwind (ex.: "h-7"); a largura segue a proporção. */
  className?: string;
  /** Largura renderizada aproximada, p/ o next/image não servir 2048px. */
  sizes: string;
  priority?: boolean;
}) {
  const v = VARIANTS[variant];
  // Com texto ao lado (mark), a imagem é decorativa; sozinha (stacked), é o nome.
  const alt = variant === "mark" ? "" : "CG Educacional";
  const common = { alt, width: v.width, height: v.height, sizes, priority };
  return (
    <>
      <Image
        src={`/brand/${v.src}.png`}
        {...common}
        className={cn("w-auto dark:hidden", className)}
      />
      <Image
        src={`/brand/${v.src}-white.png`}
        {...common}
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}
