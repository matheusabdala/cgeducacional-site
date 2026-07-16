import Link from "next/link";
import { Plus, BookOpen, SearchX } from "lucide-react";
import type { Prisma, CourseCategory } from "@prisma/client";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CourseRowActions } from "@/components/admin/course-row-actions";
import {
  CourseFilters,
  type CourseSearchParams,
} from "@/components/admin/course-filters";
import { Pagination } from "@/components/admin/pagination";
import { COURSE_CATEGORIES } from "@/lib/validations/course";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  COURSE_CATEGORIES.map((c) => [c.value, c.label]),
);
const CATEGORY_VALUES = new Set<string>(COURSE_CATEGORIES.map((c) => c.value));

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function orderFor(sort?: string): Prisma.CourseOrderByWithRelationInput {
  if (sort === "title") return { title: "asc" };
  if (sort === "students") return { enrollments: { _count: "desc" } };
  return { createdAt: "desc" };
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<CourseSearchParams>;
}) {
  const profile = await getCurrentProfile();
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const category = params.category;
  const status = params.status;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.CourseWhereInput = {
    // Instrutor só enxerga os próprios cursos; admin vê tudo.
    ...(profile?.role === "admin" ? {} : { instructorId: profile!.id }),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    // Ignora categoria inválida na URL em vez de estourar no Prisma.
    ...(category && CATEGORY_VALUES.has(category)
      ? { category: category as CourseCategory }
      : {}),
    ...(status === "published"
      ? { published: true }
      : status === "draft"
        ? { published: false }
        : {}),
  };

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy: orderFor(params.sort),
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        published: true,
        _count: { select: { modules: true, enrollments: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const isFiltered = Boolean(q || category || status);
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cursos
          </h1>
          <p className="mt-1 text-muted-foreground">
            {total} curso{total === 1 ? "" : "s"}
            {isFiltered ? " no filtro" : " no total"}
            {total > 0 ? ` · mostrando ${from}–${to}` : ""}.
          </p>
        </div>
        <Link href="/admin/cursos/nova">
          <Button>
            <Plus size={18} /> Novo curso
          </Button>
        </Link>
      </div>

      <CourseFilters params={params} />

      {total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isFiltered ? <SearchX size={28} /> : <BookOpen size={28} />}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isFiltered ? "Nenhum curso encontrado" : "Nenhum curso ainda"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFiltered
                ? "Tente ajustar a busca ou os filtros."
                : "Crie seu primeiro curso para começar a montar o conteúdo."}
            </p>
          </div>
          {isFiltered ? (
            <Button asChild variant="outline">
              <Link href="/admin/cursos">Limpar filtros</Link>
            </Button>
          ) : (
            <Link href="/admin/cursos/nova">
              <Button>
                <Plus size={18} /> Criar curso
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Curso</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Conteúdo</TableHead>
                  <TableHead className="hidden lg:table-cell">Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/admin/cursos/${c.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {c.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {CATEGORY_LABEL[c.category] ?? c.category}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {c._count.modules} mód · {c._count.enrollments} alunos
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {brl(Number(c.price))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.published ? "default" : "secondary"}>
                        {c.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <CourseRowActions
                        id={c.id}
                        title={c.title}
                        published={c.published}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/cursos"
            params={params}
          />
        </>
      )}
    </div>
  );
}
