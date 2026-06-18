import { NextResponse } from "next/server";
import {
  getPayment,
  verifyWebhookSignature,
} from "@/server/payments/mercadopago";
import { reconcilePayment } from "@/server/payments/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Webhook do Mercado Pago — FONTE DA VERDADE da confirmação de pagamento.
 * Verifica a assinatura, re-busca o pagamento na API (não confia no corpo) e
 * concilia o pedido (cria a matrícula idempotente). Responde 200 sempre que o
 * evento for tratado/ignorado, para o MP não reenviar indefinidamente.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  // O id do pagamento vem na query (?data.id / ?id) e/ou no corpo JSON.
  let body: {
    type?: string;
    action?: string;
    data?: { id?: string | number };
  } = {};
  try {
    body = await request.json();
  } catch {
    // notificação sem corpo (IPN antigo) — usa a query
  }

  const qpId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const type =
    body.type ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    "";
  const dataId = body.data?.id != null ? String(body.data.id) : qpId;

  // Verificação de assinatura (se o segredo estiver configurado).
  if (!verifyWebhookSignature(request.headers, dataId)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  // Só tratamos eventos de pagamento.
  if (!/payment/i.test(type) || !dataId) {
    return NextResponse.json({ ignored: true });
  }

  try {
    const payment = await getPayment(dataId);
    const orderId = payment.external_reference;
    if (orderId) {
      await reconcilePayment(orderId, payment);
    }
  } catch (e) {
    // Loga e responde 200: o MP reenvia; e o polling do PIX também concilia.
    console.error("[webhook MP] erro ao conciliar:", e);
  }

  return NextResponse.json({ received: true });
}

// Alguns testes do MP fazem GET de verificação.
export async function GET() {
  return NextResponse.json({ ok: true });
}
