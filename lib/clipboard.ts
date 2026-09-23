/**
 * Copia texto para a área de transferência. Tenta a API moderna e, se o navegador
 * bloquear (sem foco, http, WebView), cai no `execCommand("copy")`.
 * Retorna `false` se nada funcionou — aí a UI deve mostrar o texto para copiar à mão.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* tenta o fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
