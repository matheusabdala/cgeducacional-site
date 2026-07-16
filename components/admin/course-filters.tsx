"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { COURSE_CATEGORIES } from "@/lib/validations/course";

/** Radix Select não aceita value="" — sentinela para "sem filtro". */
const ALL = "__all__";

export type CourseSearchParams = {
  q?: string;
  category?: string;
  status?: string;
  sort?: string;
  page?: string;
};

const STATUS_OPTIONS = [
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "title", label: "Título (A–Z)" },
  { value: "students", label: "Mais alunos" },
];

export function CourseFilters({ params }: { params: CourseSearchParams }) {
  const router = useRouter();
  const [q, setQ] = React.useState(params.q ?? "");

  /** Monta a URL aplicando `patch`; qualquer filtro novo volta pra página 1. */
  const buildUrl = React.useCallback(
    (patch: CourseSearchParams) => {
      const merged: CourseSearchParams = { ...params, ...patch, page: undefined };
      const next = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (value) next.set(key, value);
      }
      const qs = next.toString();
      return qs ? `/admin/cursos?${qs}` : "/admin/cursos";
    },
    [params],
  );

  // Busca com debounce — evita uma navegação por tecla digitada.
  React.useEffect(() => {
    if ((params.q ?? "") === q) return;
    const timer = setTimeout(() => router.push(buildUrl({ q })), 350);
    return () => clearTimeout(timer);
  }, [q, params.q, buildUrl, router]);

  const hasFilters = Boolean(
    params.q || params.category || params.status || params.sort,
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título…"
          aria-label="Buscar cursos por título"
          className="pl-9"
        />
      </div>

      <Select
        value={params.category ?? ALL}
        onValueChange={(v) =>
          router.push(buildUrl({ category: v === ALL ? undefined : v }))
        }
      >
        <SelectTrigger className="sm:w-48" aria-label="Filtrar por categoria">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as categorias</SelectItem>
          {COURSE_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.status ?? ALL}
        onValueChange={(v) =>
          router.push(buildUrl({ status: v === ALL ? undefined : v }))
        }
      >
        <SelectTrigger className="sm:w-40" aria-label="Filtrar por status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.sort ?? "recent"}
        onValueChange={(v) => router.push(buildUrl({ sort: v }))}
      >
        <SelectTrigger className="sm:w-44" aria-label="Ordenar">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/admin/cursos" onClick={() => setQ("")}>
            <X size={14} /> Limpar
          </Link>
        </Button>
      )}
    </div>
  );
}
