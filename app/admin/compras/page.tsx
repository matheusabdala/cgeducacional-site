import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge, methodLabel } from "@/components/admin/order-status";

export const dynamic = "force-dynamic";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: Date) =>
  d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "pagas", label: "Pagas" },
  { key: "abandonados", label: "Carrinhos abandonados" },
] as const;

function whereFor(filter: string): Prisma.OrderWhereInput {
  if (filter === "pagas") return { status: "approved" };
  if (filter === "abandonados")
    return { status: { in: ["initiated", "pending", "rejected"] } };
  return {};
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireRole(["admin"], "/admin");
  const { filter = "todas" } = await searchParams;

  const [orders, agg, paidCount, abandonedCount] = await Promise.all([
    prisma.order.findMany({
      where: whereFor(filter),
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.order.aggregate({
      where: { status: "approved" },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: { status: "approved" } }),
    prisma.order.count({
      where: { status: { in: ["initiated", "pending", "rejected"] } },
    }),
  ]);

  const revenue = Number(agg._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Compras
        </h1>
        <p className="text-sm text-muted-foreground">
          Vendas, pagamentos e carrinhos abandonados (remarketing).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Receita (aprovada)" value={brl(revenue)} />
        <Stat label="Compras pagas" value={String(paidCount)} />
        <Stat label="Carrinhos abandonados" value={String(abandonedCount)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/compras?filter=${f.key}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              filter === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Aluno</th>
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma compra neste filtro.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{o.user.name}</div>
                      <div className="text-xs text-muted-foreground">{o.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.course.title}</td>
                    <td className="px-4 py-3">
                      {o.method ? (
                        <Badge variant="secondary">{methodLabel(o.method)}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {brl(Number(o.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/compras/${o.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
