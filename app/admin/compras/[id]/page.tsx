import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/cpf";
import { OrderStatusBadge, methodLabel } from "@/components/admin/order-status";

export const dynamic = "force-dynamic";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: Date | null) =>
  d ? d.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" }) : "—";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"], "/admin");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, cpf: true } },
      course: { select: { title: true, slug: true } },
    },
  });
  if (!order) notFound();

  const isAbandoned = ["initiated", "pending", "rejected"].includes(order.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/compras"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Voltar para compras
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Compra
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold text-foreground">Pagamento</h2>
          <Row label="Curso" value={order.course.title} />
          <Row label="Método" value={order.method ? methodLabel(order.method) : "—"} />
          <Row label="Preço" value={brl(Number(order.baseAmount))} />
          <Row label="Desconto" value={brl(Number(order.discount))} />
          <Row label="Total" value={brl(Number(order.amount))} />
          {order.method === "credit_card" && (
            <Row label="Parcelas" value={`${order.installments}x`} />
          )}
          <Row label="Pago em" value={fmtDate(order.paidAt)} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold text-foreground">Cliente</h2>
          <Row label="Nome" value={order.user.name} />
          <Row label="E-mail" value={order.user.email} />
          <Row
            label="CPF (cadastro)"
            value={order.user.cpf ? formatCpf(order.user.cpf) : "—"}
          />
          <Row
            label="CPF (pagamento)"
            value={order.payerCpf ? formatCpf(order.payerCpf) : "—"}
          />
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-semibold text-foreground">Detalhes técnicos</h2>
        <Row label="ID do pedido" value={<code className="text-xs">{order.id}</code>} />
        <Row
          label="ID no Mercado Pago"
          value={order.mpPaymentId ? <code className="text-xs">{order.mpPaymentId}</code> : "—"}
        />
        <Row label="Detalhe do status" value={order.mpStatusDetail ?? "—"} />
        <Row label="Criado em" value={fmtDate(order.createdAt)} />
      </section>

      {isAbandoned && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="mb-1 font-semibold text-foreground">
            Remarketing — carrinho não concluído
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Este aluno demonstrou interesse mas não concluiu o pagamento. Que tal
            um empurrãozinho?
          </p>
          <a
            href={`mailto:${order.user.email}?subject=${encodeURIComponent(
              `Seu acesso ao curso ${order.course.title} está te esperando`,
            )}&body=${encodeURIComponent(
              `Olá, ${order.user.name}! Vi que você se interessou pelo curso "${order.course.title}". Posso te ajudar a concluir a matrícula?`,
            )}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Mail size={16} /> Enviar e-mail
          </a>
        </section>
      )}
    </div>
  );
}
