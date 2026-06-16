import * as React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

/** Moldura visual compartilhada pelas telas de login/cadastro/recuperação. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
              <GraduationCap size={24} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              CG Educacional
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          {children}
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
