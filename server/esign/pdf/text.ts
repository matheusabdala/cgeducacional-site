import type { PDFFont } from "pdf-lib";

// Caracteres do WinAnsi (fontes padrão do PDF) fora do Latin-1.
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

/**
 * As fontes padrão do PDF (Helvetica) só codificam WinAnsi. Acentos do português
 * estão cobertos; o resto (emoji, outros alfabetos) vira o equivalente sem acento
 * ou "?", para o pdf-lib não quebrar com nome digitado pelo usuário.
 */
export function pdfSafe(input: string): string {
  let out = "";
  for (const ch of input.normalize("NFC")) {
    const code = ch.codePointAt(0)!;
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(ch)) {
      out += ch;
      continue;
    }
    if (ch === "\n" || ch === "\t") {
      out += " ";
      continue;
    }
    const stripped = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    out += /^[\x20-\x7e]+$/.test(stripped) ? stripped : "?";
  }
  return out;
}

/** Corta o texto com "…" até caber na largura. */
export function fitText(font: PDFFont, text: string, size: number, maxWidth: number): string {
  const safe = pdfSafe(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let s = safe;
  while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > maxWidth) s = s.slice(0, -1);
  return `${s}…`;
}

/** Quebra em linhas pela largura (palavras longas, como hashes, são cortadas). */
export function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const push = (w: string) => {
    // palavra maior que a linha: fatia
    while (font.widthOfTextAtSize(w, size) > maxWidth && w.length > 1) {
      let cut = w.length;
      while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxWidth) cut--;
      lines.push(w.slice(0, cut));
      w = w.slice(cut);
    }
    return w;
  };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = push(word);
    }
  }
  if (line) lines.push(line);
  return lines;
}
