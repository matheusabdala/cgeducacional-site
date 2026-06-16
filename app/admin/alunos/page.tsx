import Link from "next/link";
import { Search, Users, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR");

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["admin", "instructor"], "/admin");
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const students = await prisma.user.findMany({
    where: {
      role: "student",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = students.length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Alunos
          </h1>
          <Badge variant="secondary">
            {total} {total === 1 ? "aluno" : "alunos"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie os alunos cadastrados e suas matrículas nos cursos.
        </p>
      </div>

      {/* Busca */}
      <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome ou email…"
            aria-label="Buscar alunos por nome ou email"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {/* Tabela / estado vazio */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {query ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground">
              {query
                ? "Tente ajustar os termos da busca."
                : "Os alunos aparecem aqui assim que se cadastram na plataforma."}
            </p>
          </div>
          {query ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/alunos">Limpar busca</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Aluno</TableHead>
                <TableHead className="w-32">Matrículas</TableHead>
                <TableHead className="w-36">Cadastro</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {student.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(student.name)
                        )}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student._count.enrollments > 0 ? "default" : "secondary"}>
                      {student._count.enrollments}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dateFmt.format(student.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/alunos/${student.id}`}>
                        Gerenciar
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
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
