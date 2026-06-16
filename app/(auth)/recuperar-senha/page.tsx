import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = {
  title: "Recuperar senha — CG Educacional",
};

export default function RecuperarSenhaPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Enviaremos um link para você redefinir sua senha"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <ResetForm />
    </AuthCard>
  );
}
