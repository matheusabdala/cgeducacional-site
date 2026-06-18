import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicEnv } from "@/lib/env";
import { computeAmount } from "@/lib/pricing";
import { CourseCategory } from "@/types";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { initiateOrder } from "./actions";

export const dynamic = "force-dynamic";

const CAT: Record<string, CourseCategory> = {
  neurociencia: CourseCategory.Neurociencia,
  pedagogia: CourseCategory.Pedagogia,
  gestao: CourseCategory.Gestao,
  inclusao: CourseCategory.Inclusao,
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await requireUser(`/checkout/${courseId}`);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      published: true,
      category: true,
    },
  });
  if (!course || !course.published) notFound();

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true },
  });
  if (enrolled) redirect(`/aprender/${course.slug}`);

  const start = await initiateOrder(courseId);
  if (!start.orderId) {
    if (start.alreadyEnrolled) redirect(`/aprender/${course.slug}`);
    redirect(`/cursos/${courseId}`);
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { cpf: true },
  });

  const price = Number(course.price);
  const card = computeAmount(price, "credit_card");
  const pix = computeAmount(price, "pix");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href={`/cursos/${courseId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> Voltar para o curso
        </Link>
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
          Finalizar compra
        </h1>
        <CheckoutClient
          orderId={start.orderId}
          courseTitle={course.title}
          courseCategory={CAT[course.category] ?? CourseCategory.Neurociencia}
          courseSlug={course.slug}
          basePrice={price}
          cardAmount={card.total}
          pixAmount={pix.total}
          pixDiscount={pix.discount}
          pixDiscountPct={pix.discountPct}
          publicKey={publicEnv.mercadopagoPublicKey}
          defaultCpf={profile?.cpf ?? undefined}
        />
      </div>
    </div>
  );
}
