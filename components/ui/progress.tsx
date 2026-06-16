import { cn } from "@/lib/utils";

/** Barra de progresso simples (0–100). */
export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-expo-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
