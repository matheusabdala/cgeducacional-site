"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider, FieldError, FormBanner } from "@/components/auth/form-bits";
import { signUpAction } from "@/app/(auth)/actions";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

export function SignupForm({ next }: { next?: string }) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setServerError(null);
    const result = await signUpAction(values);
    if (result?.error) setServerError(result.error);
    else if (result?.success) setSuccessMsg(result.message ?? "Cadastro realizado!");
  }

  if (successMsg) {
    return <FormBanner variant="success">{successMsg}</FormBanner>;
  }

  return (
    <div className="space-y-5">
      <GoogleButton next={next} />
      <AuthDivider />

      {serverError && <FormBanner variant="error">{serverError}</FormBanner>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Maria da Silva"
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
