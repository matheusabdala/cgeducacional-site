"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanCpf } from "@/lib/cpf";
import {
  signInSchema,
  signUpSchema,
  resetRequestSchema,
} from "@/lib/validations/auth";

type AuthState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** URL absoluta do site (para redirects de OAuth e e-mail). */
async function getOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function safeNext(next: unknown): string {
  // Evita open-redirect: só caminhos internos.
  return typeof next === "string" && next.startsWith("/") ? next : "/aprender";
}

export async function signInAction(
  values: unknown,
  next?: string,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(safeNext(next));
}

export async function signUpAction(values: unknown): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, password, cpf } = parsed.data;
  const cleanedCpf = cleanCpf(cpf);

  // CPF é único por aluno.
  const cpfTaken = await prisma.user.findUnique({
    where: { cpf: cleanedCpf },
    select: { id: true },
  });
  if (cpfTaken) return { error: "Este CPF já está cadastrado." };

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, cpf: cleanedCpf },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Cadastro repetido com confirmação ativa: Supabase devolve usuário sem
  // identidades (anti-enumeração). Tratamos como "verifique seu e-mail".
  if (data.user && data.user.identities?.length === 0) {
    return {
      success: true,
      message: "Se este e-mail for novo, você receberá um link de confirmação.",
    };
  }

  if (data.user) {
    await ensureProfile(data.user);
  }

  if (data.session) {
    // Confirmação de e-mail desativada → já está logado.
    redirect("/aprender");
  }

  return {
    success: true,
    message:
      "Cadastro realizado! Confira seu e-mail para confirmar a conta antes de entrar.",
  };
}

export async function signInWithGoogleAction(next?: string): Promise<AuthState> {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        safeNext(next),
      )}`,
    },
  });

  if (error) {
    return { error: "Não foi possível iniciar o login com Google." };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Resposta inesperada do provedor." };
}

export async function requestPasswordResetAction(
  values: unknown,
): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  // Resposta neutra (não revela se o e-mail existe).
  return {
    success: true,
    message:
      "Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
