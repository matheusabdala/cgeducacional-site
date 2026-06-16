"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provider de tema (next-themes). Persiste a escolha do usuário e evita
 * flash de tema errado. Padrão = claro; usuário pode alternar p/ escuro.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
