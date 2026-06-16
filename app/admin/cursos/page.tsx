import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
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
import { COURSE_CATEGORIES } from "@/lib/validations/course";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  COURSE_CATEGORIES.map((c) => [c.value, c.label]),
);

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function CursosPage() {
  const profile = await getCurrentProfile();
  const where =
    profile?.role === "admin" ? {} : { instructorId: profile!.id };

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      price: true,
      published: true,
      _count: { select: { modules: true, enrollments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cursos
          </h1>
          <p className="mt-1 text-muted-foreground">
            {courses.length} curso{courses.length === 1 ? "" : "s"} no total.
          </p>
        </div>
        <Link href="/admin/cursos/nova">
          <Button>
            <Plus size={18} /> Novo curso
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum curso ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro curso para começar a montar o conteúdo.
            </p>
          </div>
          <Link href="/admin/cursos/nova">
            <Button>
              <Plus size={18} /> Criar curso
            </Button>
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
