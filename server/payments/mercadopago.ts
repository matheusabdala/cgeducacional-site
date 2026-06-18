import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { serverEnv } from "@/lib/env";

/**
 * Cliente do Mercado Pago (checkout transparente) via REST + access token.
 * Dados de cartão NUNCA chegam aqui — o cliente tokeniza com o SDK e manda só o
 * token. O valor é sempre recalculado no servidor antes de criar o pagamento.
 */

const API = "https://api.mercadopago.com";

export class PaymentError extends Error {
  status: number;
  detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "PaymentError";
    this.status = status;
    this.detail = detail;
  }
}

export type MpPayment = {
  id: number | string;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded ...
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_method_id?: string;
  metadata?: Record<string, unknown>;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string; // copia-e-cola
      qr_code_base64?: string; // imagem PNG base64
      ticket_url?: string;
    };
  };
};

async function mpFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const { idempotencyKey, ...rest } = init;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${serverEnv.mercadopagoAccessToken()}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (res.status >= 300) {
    const j = json as { message?: string; cause?: { description?: string }[] };
    const detail = j?.cause?.[0]?.description ?? j?.message;
    throw new PaymentError(
      detail ?? `Mercado Pago respondeu ${res.status}`,
      res.status,
      detail,
    );
  }
  return json as T;
}

type Payer = { email: string; cpf: string; firstName?: string };

/** Cria pagamento com cartão (token gerado no cliente). */
export async function createCardPayment(input: {
  amount: number;
  token: string;
  description: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payer: Payer;
  externalReference: string;
  notificationUrl: string;
  idempotencyKey: string;
}): Promise<MpPayment> {
  return mpFetch<MpPayment>("/v1/payments", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      transaction_amount: input.amount,
      token: input.token,
      description: input.description,
      installments: input.installments,
      payment_method_id: input.paymentMethodId,
      ...(input.issuerId ? { issuer_id: input.issuerId } : {}),
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      payer: {
        email: input.payer.email,
        ...(input.payer.firstName ? { first_name: input.payer.firstName } : {}),
        identification: { type: "CPF", number: input.payer.cpf },
      },
      metadata: { order_id: input.externalReference },
    }),
  });
}

/** Cria pagamento PIX — retorna o QR (imagem + copia-e-cola). */
export async function createPixPayment(input: {
  amount: number;
  description: string;
  payer: Payer;
  externalReference: string;
  notificationUrl: string;
  idempotencyKey: string;
}): Promise<MpPayment> {
  return mpFetch<MpPayment>("/v1/payments", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      payer: {
        email: input.payer.email,
        first_name: input.payer.firstName ?? "Aluno",
        identification: { type: "CPF", number: input.payer.cpf },
      },
      metadata: { order_id: input.externalReference },
    }),
  });
}

/** Consulta um pagamento (fonte da verdade no webhook e no polling do PIX). */
export async function getPayment(id: string | number): Promise<MpPayment> {
  return mpFetch<MpPayment>(`/v1/payments/${id}`, { method: "GET" });
}

/**
 * Verifica a assinatura do webhook do Mercado Pago (`x-signature`).
 * Manifesto: `id:<dataId>;request-id:<x-request-id>;ts:<ts>;` com HMAC-SHA256.
 * Sem segredo configurado, retorna `true` (a confirmação real vem do re-fetch).
 */
export function verifyWebhookSignature(
  headers: Headers,
  dataId: string | null,
): boolean {
  const secret = serverEnv.mercadopagoWebhookSecret();
  if (!secret) return true; // sem segredo → confia no re-fetch do pagamento

  const signature = headers.get("x-signature");
  const requestId = headers.get("x-request-id") ?? "";
  if (!signature || !dataId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // dataId com letras deve ser minúsculo no manifesto (regra do MP).
  const id = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
