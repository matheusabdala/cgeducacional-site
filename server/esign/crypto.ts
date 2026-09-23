import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { env } from "./deps";

/** Segredo aleatório de 256 bits em base64url (links e sessões de QR). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Hash usado para localizar tokens/códigos no banco (nunca guardamos o valor). */
export const tokenHash = (token: string) => sha256Hex(`esign-token:${token}`);

function key(): Buffer {
  return createHash("sha256").update(`esign-key:${env.secret()}`).digest();
}

/** AES-256-GCM — permite ao operador copiar o link de novo sem rotacioná-lo. */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decrypt(payload: string): string {
  const [v, iv, tag, ct] = payload.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Formato cifrado inválido");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}

/** Código de 6 dígitos para confirmação por e-mail. */
export function newOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function otpHash(signerId: string, code: string): string {
  return createHmac("sha256", env.secret()).update(`otp:${signerId}:${code}`).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // sem 0/O/1/I/L

/** Código público do documento, ex.: DOC-7K3M-Q2ZP. */
export function newDocCode(): string {
  const pick = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join("");
  return `DOC-${pick()}-${pick()}`;
}

/** JSON com chaves ordenadas (jsonb reordena chaves; o hash precisa ser estável). */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}
