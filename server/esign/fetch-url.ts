import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ESIGN } from "./config";
import { EsignError } from "./errors";

/** Bloqueia endereços internos (SSRF): loopback, redes privadas, link-local… */
function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new EsignError("forbidden_url", "Link inválido.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new EsignError("forbidden_url", "Use um link http(s).");
  }
  if (url.username || url.password) throw new EsignError("forbidden_url", "Link com usuário/senha não é aceito.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addrs.length === 0) throw new EsignError("fetch_failed", "Não foi possível encontrar esse endereço.");
  if (addrs.some((a) => isPrivateIp(a.address))) {
    throw new EsignError("forbidden_url", "Esse endereço não é permitido.");
  }
  return url;
}

/** Converte links de compartilhamento comuns em links de download direto. */
function directDownloadUrl(url: URL): URL {
  // Google Drive: /file/d/<id>/view → uc?export=download&id=<id>
  const drive = url.hostname === "drive.google.com" && url.pathname.match(/\/file\/d\/([^/]+)/);
  if (drive) return new URL(`https://drive.google.com/uc?export=download&id=${drive[1]}`);
  // Dropbox: dl=0 → dl=1
  if (/(^|\.)dropbox\.com$/.test(url.hostname)) {
    const u = new URL(url);
    u.searchParams.set("dl", "1");
    return u;
  }
  return url;
}

/**
 * Baixa um PDF de um link público com proteção contra SSRF, limite de tamanho,
 * timeout e no máximo 3 redirecionamentos (cada um revalidado).
 */
export async function fetchPdfFromUrl(raw: string): Promise<{ bytes: Uint8Array; fileName: string; mime: string }> {
  let url = directDownloadUrl(await assertPublicUrl(raw.trim()));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ESIGN.urlFetchTimeoutMs);
  try {
    let res: Response | null = null;
    for (let hop = 0; hop <= ESIGN.urlFetchMaxRedirects; hop++) {
      res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "CG-Educacional-Esign/1.0", Accept: "application/pdf,*/*;q=0.8" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
        continue;
      }
      break;
    }
    if (!res || res.status >= 300) {
      throw new EsignError("fetch_failed", `O link respondeu com erro (${res?.status ?? "?"}). Confira se ele é público.`);
    }
    const len = Number(res.headers.get("content-length") ?? "0");
    if (len > ESIGN.maxPdfBytes) throw new EsignError("too_large", "O arquivo do link passa de 25 MB.");

    const reader = res.body?.getReader();
    if (!reader) throw new EsignError("fetch_failed", "O link não retornou um arquivo.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > ESIGN.maxPdfBytes) {
        await reader.cancel();
        throw new EsignError("too_large", "O arquivo do link passa de 25 MB.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      bytes.set(c, off);
      off += c.byteLength;
    }

    const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const isPdf = Buffer.from(bytes.subarray(0, 1024)).toString("latin1").includes("%PDF-");
    if (!isPdf) {
      throw new EsignError(
        "unsupported_type",
        mime.includes("html")
          ? "O link abriu uma página, não um PDF. Use o link direto do arquivo (ou baixe e envie do computador)."
          : "O link não aponta para um PDF.",
      );
    }
    const cd = res.headers.get("content-disposition") ?? "";
    const fromHeader = cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ?? cd.match(/filename="?([^";]+)"?/i)?.[1];
    const fromPath = decodeURIComponent(url.pathname.split("/").pop() || "");
    let fileName = (fromHeader ? decodeURIComponent(fromHeader) : fromPath) || "documento.pdf";
    if (!/\.pdf$/i.test(fileName)) fileName = `${fileName.replace(/\.[^.]*$/, "") || "documento"}.pdf`;
    return { bytes, fileName, mime: "application/pdf" };
  } catch (e) {
    if (e instanceof EsignError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new EsignError("fetch_failed", "O link demorou demais para responder.");
    }
    throw new EsignError("fetch_failed", "Não foi possível baixar o arquivo desse link.");
  } finally {
    clearTimeout(timer);
  }
}
