import * as React from "react";
import { cn } from "@/lib/utils";

/** Mensagem de erro de um campo (RHF). Não renderiza nada se não houver erro. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

/** Banner de feedback do formulário (erro ou sucesso). */
export function FormBanner({
  variant = "error",
  children,
}: {
  variant?: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      )}
    >
      {children}
    </div>
  );
}

/** Divisor "ou" entre o login social e o formulário. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        ou
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
