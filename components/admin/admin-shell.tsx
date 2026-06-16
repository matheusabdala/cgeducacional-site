"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Menu,
  X,
  ExternalLink,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/cursos", label: "Cursos", icon: BookOpen },
  { href: "/admin/alunos", label: "Alunos", icon: Users },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  instructor: "Professor",
  student: "Aluno",
};

export function AdminShell({
  profile,
  children,
}: {
  profile: { name: string; email: string; role: string; avatarUrl: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/admin" className="flex items-center gap-2.5 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
          <GraduationCap size={20} />
        </div>
        <div className="leading-tight">
          <span className="block text-sm font-semibold text-foreground">
            CG Educacional
          </span>
          <span className="block text-xs text-muted-foreground">Painel</span>
        </div>
      </Link>
      {nav}
      <div className="mt-auto">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink size={16} /> Voltar ao site
        </Link>
      </div>
    </div>
  );

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar — fixa no desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card/60 backdrop-blur-xl lg:block">
        {sidebarInner}
      </aside>

      {/* Sidebar — overlay no mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card shadow-card-hover">
            <button
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <button
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[10rem] truncate font-medium text-foreground">
                    {profile.name}
                  </span>
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1 normal-case">
                  <span className="truncate text-sm font-medium text-foreground">
                    {profile.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {profile.email}
                  </span>
                  <Badge variant="secondary" className="mt-1 w-fit">
                    {ROLE_LABEL[profile.role] ?? profile.role}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem variant="destructive" asChild>
                    <button type="submit" className="w-full">
                      <LogOut size={16} /> Sair
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
