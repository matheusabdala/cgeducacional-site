import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar — CG Educacional" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const initialError =
    sp.error === "auth"
      ? "Não foi possível autenticar. Tente novamente."
      : undefined;

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse sua conta da CG Educacional"
      footer={
        <>
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-primary hover:underline"
          >
            Cadastre-se
          </Link>
        </>
      }
    >
      <LoginForm next={sp.next} initialError={initialError} />
    </AuthCard>
  );
}
