import "server-only";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { sendEmail } from "@/server/email";
import { enrollmentEmail } from "@/server/email/templates";
import type { MpPayment } from "@/server/payments/mercadopago";

/** Mapeia o status do Mercado Pago para o status interno do pedido. */
export function mapStatus(s: string): OrderStatus {
  switch (s) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending"; // pending, in_process, authorized, in_mediation
  }
}

/** Matrícula + e-mail ao aprovar (idempotente). */
export async function fulfillOrder(
  userId: string,
  courseId: string,
): Promise<void> {
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
  if (existing) return;

  const [user, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, slug: true },
    }),
  ]);
  if (user?.email && course) {
    const mail = enrollmentEmail({
      name: user.name,
      courseTitle: course.title,
      url: `${siteUrl()}/aprender/${course.slug}`,
    });
    await sendEmail({ to: user.email, ...mail });
  }
}

/**
 * Aplica o estado de um pagamento do MP sobre o pedido (idempotente, anti-race).
 * Um pagamento APROVADO sempre vence; estados não-finais só atualizam se forem da
 * última tentativa registrada no pedido (evita webhook antigo sobrescrever).
 */
export async function reconcilePayment(
  orderId: string,
  payment: MpPayment,
): Promise<OrderStatus> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return "cancelled";
  if (order.status === "approved") return "approved";

  const mapped = mapStatus(payment.status);
  const isLatest = order.mpPaymentId === String(payment.id);
  if (mapped !== "approved" && !isLatest) return order.status;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: mapped,
      mpStatusDetail: payment.status_detail ?? null,
      mpPaymentId: String(payment.id),
      paidAt: mapped === "approved" ? new Date() : order.paidAt,
    },
  });

  if (mapped === "approved") {
    await fulfillOrder(order.userId, order.courseId);
  }
  return mapped;
}
