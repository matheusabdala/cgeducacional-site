"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/** Recarrega os dados do servidor periodicamente (só com a aba visível). */
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);
  return null;
}
