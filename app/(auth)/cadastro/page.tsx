import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar conta — CG Educacional" };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece sua jornada na CG Educacional"
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <SignupForm next={sp.next} />
    </AuthCard>
  );
}
