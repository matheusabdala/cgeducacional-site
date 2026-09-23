import { UAParser } from "ua-parser-js";
import { ESIGN } from "./config";

/** Formatação compartilhada (PDF, e-mails, telas). Sem dependências do app. */

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** CPF: 11 dígitos + dígitos verificadores (rejeita todos iguais). */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value ?? "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function formatCpfFull(cpf: string): string {
  const d = onlyDigits(cpf);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

/** CPF mascarado para tudo que é público: ***.456.789-** */
export function maskCpf(cpf: string | null | undefined): string {
  const d = onlyDigits(cpf ?? "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "—";
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(1, user.length - visible.length))}@${domain}`;
}

const dtf = new Intl.DateTimeFormat("pt-BR", {
  timeZone: ESIGN.timeZone,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const offsetFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ESIGN.timeZone,
  timeZoneName: "shortOffset",
});

/** "23/09/2026 14:32:05 (GMT-4)" no fuso de Campo Grande/MS. */
export function formatDateTime(d: Date): string {
  const offset =
    offsetFmt.formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "";
  return `${dtf.format(d).replace(",", "")}${offset ? ` (${offset})` : ""}`;
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: ESIGN.timeZone, dateStyle: "short" }).format(d);
}

/** Resumo legível do dispositivo a partir do user-agent. */
export function describeDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return "Desconhecido";
  const r = new UAParser(userAgent).getResult();
  const browser = [r.browser.name, r.browser.major].filter(Boolean).join(" ");
  const os = [r.os.name, r.os.version].filter(Boolean).join(" ");
  const kind =
    r.device.type === "mobile" ? "celular" : r.device.type === "tablet" ? "tablet" : "computador";
  const model = [r.device.vendor, r.device.model].filter(Boolean).join(" ");
  return [browser || "Navegador", os || null, model || null, kind].filter(Boolean).join(" · ");
}

export const METHOD_LABEL = {
  draw: "Desenhada na tela",
  type: "Nome digitado (fonte cursiva)",
  phone: "Desenhada no celular (QR code)",
} as const;
