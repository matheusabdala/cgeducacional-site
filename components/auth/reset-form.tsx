"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormBanner } from "@/components/auth/form-bits";
import { requestPasswordResetAction } from "@/app/(auth)/actions";
import {
  resetRequestSchema,
  type ResetRequestInput,
} from "@/lib/validations/auth";

export function ResetForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ResetRequestInput) {
    setServerError(null);
    const result = await requestPasswordResetAction(values);
    if (result?.error) setServerError(result.error);
    else if (result?.success)
      setSuccessMsg(result.message ?? "Verifique seu e-mail.");
  }

  if (successMsg) {
    return <FormBanner variant="success">{successMsg}</FormBanner>;
  }

  return (
    <div className="space-y-5">
      {serverError && <FormBanner variant="error">{serverError}</FormBanner>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Enviando…" : "Enviar link de recuperação"}
        </Button>
      </form>
    </div>
  );
}
