"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cleanCpf, isValidCpf } from "@/lib/cpf";
import { computeAmount } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";
import {
  createCardPayment,
  createPixPayment,
  getPayment,
  PaymentError,
  type MpPayment,
} from "@/server/payments/mercadopago";
import { mapStatus, reconcilePayment } from "@/server/payments/orders";

const notificationUrl = () => `${siteUrl()}/api/payments/webhook`;

async function loadOwnedOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { course: { select: { id: true, price: true, published: true } } },
  });
  if (!order || order.userId !== userId) return null;
  return order;
}

type StartResult = {
  ok: boolean;
  orderId?: string;
  alreadyEnrolled?: boolean;
  error?: string;
};

/** Cria/reutiliza o pedido do carrinho (status initiated) para o curso. */
export async function initiateOrder(courseId: string): Promise<StartResult> {
  const user = await requireUser(`/checkout/${courseId}`);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, price: true, published: true },
  });
  if (!course || !course.published) return { ok: false, error: "Curso indisponível" };

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true },
  });
  if (enrolled) return { ok: false, alreadyEnrolled: true };

  // Reusa o pedido não-pago mais recente (mantém um "carrinho" por curso).
  const reusable = await prisma.order.findFirst({
    where: { userId: user.id, courseId, status: { in: ["initiated", "pending", "rejected"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (reusable) return { ok: true, orderId: reusable.id };

  const base = Number(course.price);
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      courseId,
      status: "initiated",
      baseAmount: base,
      amount: base,
    },
    select: { id: true },
  });
  return { ok: true, orderId: order.id };
}

type PayResult = {
  status?: OrderStatus;
  statusDetail?: string;
  error?: string;
};

/** Pagamento com cartão (token gerado no cliente via SDK do MP). */
export async function payWithCard(input: {
  orderId: string;
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  cpf: string;
}): Promise<PayResult> {
  const user = await requireUser();
  const order = await loadOwnedOrder(input.orderId, user.id);
  if (!order) return { error: "Pedido não encontrado" };
  if (order.status === "approved") return { status: "approved" };
  if (!order.course.published) return { error: "Curso indisponível" };

  const cpf = cleanCpf(input.cpf);
  if (!isValidCpf(cpf)) return { error: "CPF do titular inválido" };
  if (!input.token) return { error: "Dados do cartão inválidos" };
  const installments = Math.min(12, Math.max(1, Math.trunc(input.installments || 1)));

  // Valor SEMPRE recalculado no servidor a partir do preço do curso.
  const price = computeAmount(Number(order.course.price), "credit_card");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      method: "credit_card",
      baseAmount: price.base,
      discount: price.discount,
      amount: price.total,
      installments,
      payerCpf: cpf,
      payerEmail: profile?.email ?? null,
      status: "pending",
    },
  });

  let payment: MpPayment;
  try {
    payment = await createCardPayment({
      amount: price.total,
      token: input.token,
      description: `Curso ${order.courseId}`,
      installments,
      paymentMethodId: input.paymentMethodId,
      issuerId: input.issuerId,
      payer: { email: profile?.email ?? "", cpf, firstName: profile?.name },
      externalReference: order.id,
      notificationUrl: notificationUrl(),
      idempotencyKey: randomUUID(),
    });
  } catch (e) {
    const msg = e instanceof PaymentError ? e.message : "Falha ao processar o pagamento";
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "rejected", mpStatusDetail: msg },
    });
    return { error: msg };
  }

  const status = await reconcilePayment(order.id, payment);
  revalidatePath("/aprender");
  return { status, statusDetail: payment.status_detail };
}

/** Pagamento PIX — retorna o QR (imagem + copia-e-cola). */
export async function payWithPix(input: {
  orderId: string;
  cpf: string;
}): Promise<{
  orderId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  error?: string;
}> {
  const user = await requireUser();
  const order = await loadOwnedOrder(input.orderId, user.id);
  if (!order) return { error: "Pedido não encontrado" };
  if (order.status === "approved") return { error: "Pedido já pago" };
  if (!order.course.published) return { error: "Curso indisponível" };

  const cpf = cleanCpf(input.cpf);
  if (!isValidCpf(cpf)) return { error: "CPF inválido" };

  const price = computeAmount(Number(order.course.price), "pix");
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true },
  });

  let payment: MpPayment;
  try {
    payment = await createPixPayment({
      amount: price.total,
      description: `Curso ${order.courseId}`,
      payer: { email: profile?.email ?? "", cpf, firstName: profile?.name },
      externalReference: order.id,
      notificationUrl: notificationUrl(),
      idempotencyKey: randomUUID(),
    });
  } catch (e) {
    return {
      error: e instanceof PaymentError ? e.message : "Falha ao gerar o PIX",
    };
  }

  const td = payment.point_of_interaction?.transaction_data;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      method: "pix",
      baseAmount: price.base,
      discount: price.discount,
      amount: price.total,
      installments: 1,
      payerCpf: cpf,
      payerEmail: profile?.email ?? null,
      status: mapStatus(payment.status),
      mpPaymentId: String(payment.id),
      mpStatusDetail: payment.status_detail ?? null,
      pixQrCode: td?.qr_code ?? null,
    },
  });

  return {
    orderId: order.id,
    qrCode: td?.qr_code,
    qrCodeBase64: td?.qr_code_base64,
    ticketUrl: td?.ticket_url,
  };
}

/** Polling do status (PIX). Reconciliando com o MP se ainda pendente. */
export async function getOrderStatus(
  orderId: string,
): Promise<{ status: OrderStatus; slug?: string }> {
  const user = await requireUser();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { course: { select: { slug: true } } },
  });
  if (!order || order.userId !== user.id) return { status: "cancelled" };

  if (order.status === "pending" && order.mpPaymentId) {
    try {
      const payment = await getPayment(order.mpPaymentId);
      const status = await reconcilePayment(orderId, payment);
      return { status, slug: order.course.slug };
    } catch {
      // mantém o status atual em caso de falha transitória
    }
  }
  return { status: order.status, slug: order.course.slug };
}
