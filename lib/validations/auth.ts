import { z } from "zod";
import { isValidCpf } from "@/lib/cpf";

/** Schemas Zod compartilhados entre cliente (RHF) e servidor (Server Actions). */

export const signInSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo"),
    email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
    cpf: z
      .string()
      .min(1, "Informe seu CPF")
      .refine((v) => isValidCpf(v), "CPF inválido"),
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const resetRequestSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
