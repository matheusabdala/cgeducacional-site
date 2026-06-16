import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, GraduationCap, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EnrollControls,
  RemoveEnrollmentButton,
} from "@/components/admin/enroll-controls";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR");

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  instructor: "Professor",
  student: "Aluno",
};

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

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "instructor"], "/admin");
  const { id } = await params;

  const [user, courses] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        enrollments: {
          select: {
            id: true,
            enrolledAt: true,
            completedAt: true,
            course: {
              select: { id: true, title: true, slug: true, published: true },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!user) notFound();

  const enrolledCourseIds = new Set(user.enrollments.map((e) => e.course.id));
  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Voltar */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/admin/alunos">
          <ArrowLeft size={16} />
          Voltar para alunos
        </Link>
      </Button>

      {/* Cabeçalho do aluno */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials(user.name)
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {user.name}
            </h1>
            <Badge variant="secondary">
              {ROLE_LABEL[user.role] ?? user.role}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            Cadastrado em {dateFmt.format(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Cursos matriculados */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            Cursos matriculados
          </h2>
          <Badge variant="secondary" className="ml-auto">
            {user.enrollments.length}
          </Badge>
        </div>

        {user.enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/40 px-6 py-10 text-center">
            <GraduationCap size={22} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Nenhuma matrícula ainda
            </p>
            <p className="text-sm text-muted-foreground">
              Use a seção abaixo para matricular este aluno em um curso.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {user.enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {enrollment.course.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Matriculado em {dateFmt.format(enrollment.enrolledAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {enrollment.completedAt ? (
                    <Badge variant="teal">Concluído</Badge>
                  ) : null}
                  <Badge
                    variant={enrollment.course.published ? "default" : "outline"}
                  >
                    {enrollment.course.published ? "Publicado" : "Rascunho"}
                  </Badge>
                  <RemoveEnrollmentButton
                    userId={user.id}
                    courseId={enrollment.course.id}
                    courseTitle={enrollment.course.title}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Adicionar a um curso */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <PlusCircle size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            Adicionar a um curso
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          A matrícula é manual: selecione um curso para liberar o acesso ao
          aluno.
        </p>
        <EnrollControls userId={user.id} availableCourses={availableCourses} />
      </section>
    </div>
  );
}
