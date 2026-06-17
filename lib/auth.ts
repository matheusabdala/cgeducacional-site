import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Role, User } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Helpers de sessão e autorização (server-only). O Supabase Auth é a fonte da
 * verdade de identidade; o perfil (role, nome) vive em `public.User` via Prisma.
 */

/** Usuário autenticado do Supabase (ou null). */
export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Perfil (Prisma) do usuário autenticado, ou null se não logado. */
export async function getCurrentProfile(): Promise<User | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { id: authUser.id } });
}

/**
 * Garante uma linha em `public.User` para o usuário do Auth. Chamado no cadastro
 * e no callback de OAuth (Google) — onde o perfil ainda não existe.
 */
export async function ensureProfile(authUser: SupabaseUser): Promise<User> {
  const meta = authUser.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    authUser.email?.split("@")[0] ||
    "Aluno";
  const avatarUrl =
    (meta.avatar_url as string) || (meta.picture as string) || null;
  const cpf = (meta.cpf as string) || null; // já vem limpo do cadastro

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email: authUser.email ?? undefined,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
    create: {
      id: authUser.id,
      email: authUser.email ?? `${authUser.id}@sem-email.local`,
      name,
      avatarUrl,
      ...(cpf ? { cpf } : {}),
      // role padrão = student (ver schema)
    },
  });
}

/** Exige usuário autenticado; redireciona para /login caso contrário. */
export async function requireUser(nextPath?: string): Promise<SupabaseUser> {
  const user = await getAuthUser();
  if (!user) {
    redirect(
      nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login",
    );
  }
  return user;
}

/** Exige perfil; garante a linha em `public.User` se faltar. */
export async function requireProfile(nextPath?: string): Promise<User> {
  const authUser = await requireUser(nextPath);
  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
  });
  return profile ?? ensureProfile(authUser);
}

/** Exige que o perfil tenha um dos roles; senão volta para a home. */
export async function requireRole(
  roles: Role[],
  nextPath?: string,
): Promise<User> {
  const profile = await requireProfile(nextPath);
  if (!roles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}
