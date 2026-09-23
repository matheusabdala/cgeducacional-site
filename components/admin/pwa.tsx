"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const listeners = new Set<(p: InstallPrompt | null) => void>();
let deferred: InstallPrompt | null = null;

/** Registra o service worker (share target) e guarda o convite de instalação. */
export function PwaRegister() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallPrompt;
      listeners.forEach((l) => l(deferred));
    };
    const onInstalled = () => {
      deferred = null;
      listeners.forEach((l) => l(null));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

/** "Instalar app" no menu do usuário — só aparece quando o navegador permite. */
export function InstallAppMenuItem() {
  const [prompt, setPrompt] = React.useState<InstallPrompt | null>(deferred);
  React.useEffect(() => {
    listeners.add(setPrompt);
    return () => {
      listeners.delete(setPrompt);
    };
  }, []);
  if (!prompt) return null;
  return (
    <DropdownMenuItem
      onSelect={async () => {
        await prompt.prompt();
        await prompt.userChoice.catch(() => null);
        deferred = null;
        setPrompt(null);
      }}
    >
      <Download size={16} /> Instalar app
    </DropdownMenuItem>
  );
}
