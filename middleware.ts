import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

// Prefixos que exigem login. O guard fino por role (admin vs aluno) fica nos
// layouts server-side (via requireRole), pois o middleware roda no edge.
const PROTECTED_PREFIXES = ["/aprender", "/admin"];
const AUTH_PAGES = ["/login", "/cadastro"];

/**
 * Renova a sessão do Supabase a cada requisição e aplica o guard de presença
 * de login nas áreas protegidas.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Não logado tentando área protegida → manda pro login com `next`.
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Já logado tentando login/cadastro → manda pra área do aluno.
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/aprender", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto estáticos e otimização de imagem.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
