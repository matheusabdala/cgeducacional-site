import type { OrderStatus, PaymentMethod } from "@prisma/client";

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  approved: {
    label: "Pago",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  pending: {
    label: "Pendente",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  initiated: { label: "Carrinho", cls: "bg-secondary text-muted-foreground" },
  rejected: {
    label: "Recusado",
    cls: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  cancelled: { label: "Cancelado", cls: "bg-secondary text-muted-foreground" },
  refunded: {
    label: "Estornado",
    cls: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export function methodLabel(m: PaymentMethod): string {
  return m === "pix" ? "PIX" : "Cartão";
}
