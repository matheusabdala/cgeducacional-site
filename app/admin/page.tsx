import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <span className="mt-3 block text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

export default async function AdminDashboard() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";
  const courseWhere = isAdmin ? {} : { instructorId: profile!.id };

  const [courses, published, students, enrollments, recent] = await Promise.all(
    [
      prisma.course.count({ where: courseWhere }),
      prisma.course.count({ where: { ...courseWhere, published: true } }),
      prisma.user.count({ where: { role: "student" } }),
      prisma.enrollment.count(
        isAdmin ? undefined : { where: { course: { instructorId: profile!.id } } },
      ),
      prisma.course.findMany({
        where: courseWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          published: true,
          _count: { select: { modules: true, enrollments: true } },
        },
      }),
    ],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Olá, {profile?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral da sua plataforma de ensino.
          </p>
        </div>
        <Link href="/admin/cursos/nova">
          <Button>
            <Plus size={18} /> Novo curso
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Cursos"
          value={courses}
          icon={BookOpen}
          tint="bg-primary/10 text-primary"
        />
        <StatCard
          label="Publicados"
          value={published}
          icon={CheckCircle2}
          tint="bg-teal/10 text-teal"
        />
        <StatCard
          label="Matrículas"
          value={enrollments}
          icon={GraduationCap}
          tint="bg-primary/10 text-primary"
        />
        <StatCard
          label="Alunos"
          value={students}
          icon={Users}
          tint="bg-teal/10 text-teal"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold text-foreground">Cursos recentes</h2>
          <Link
            href="/admin/cursos"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={24} />
            </div>
            <p className="text-muted-foreground">
              Você ainda não criou nenhum curso.
            </p>
            <Link href="/admin/cursos/nova">
              <Button variant="secondary" size="sm">
                <Plus size={16} /> Criar o primeiro curso
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/cursos/${c.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {c.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c._count.modules} módulos · {c._count.enrollments}{" "}
                      matrículas
                    </p>
                  </div>
                  <Badge variant={c.published ? "default" : "secondary"}>
                    {c.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
