import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  FileDown,
  PlayCircle,
  Video,
  BookOpen,
  Play,
  Lock,
} from "lucide-react";
import { getAuthUser, getCurrentProfile } from "@/lib/auth";
import { getCourseForLearner } from "@/lib/learn";
import { prisma } from "@/lib/prisma";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificateCard } from "@/components/learn/certificate-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Segundos → "X min" ou "Xh Ymin". `null` quando não há duração. */
function fmtDuration(s: number | null): string | null {
  if (s == null || s <= 0) return null;
  const totalMin = Math.round(s / 60);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  return `${Math.max(1, totalMin)} min`;
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getAuthUser();
  if (!user) return null;

  const isStaff = ["admin", "instructor"].includes(
    (await getCurrentProfile())?.role ?? "",
  );

  const course = await getCourseForLearner(user.id, slug, isStaff);
  if (!course) notFound();

  const isDone = course.total > 0 && course.percent === 100;
  const resumePath = course.resumeLessonId
    ? `/aprender/${course.slug}/${course.resumeLessonId}`
    : null;
  const startedAny = course.done > 0;

  // Certificado (só quando concluído e o aluno é o dono — não staff).
  let cert: { code: string | null; certificateUrl: string | null } | null = null;
  let hasCpf = false;
  if (isDone && !isStaff) {
    const [c, u] = await Promise.all([
      prisma.certificate.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        select: { code: true, certificateUrl: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { cpf: true },
      }),
    ]);
    cert = c;
    hasCpf = !!u?.cpf;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/aprender"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Meus cursos
      </Link>

      <header className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {course.title}
            </h1>
            {isDone && (
              <Badge variant="teal">
                <CheckCircle2 size={14} /> Concluído
              </Badge>
            )}
          </div>
          {course.description && (
            <p className="max-w-2xl text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-card">
          <Progress value={course.percent} className="h-2.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {course.percent}% concluído
            </span>{" "}
            ({course.done}/{course.total} aula{course.total === 1 ? "" : "s"})
          </p>
          {resumePath && (
            <div className="pt-2">
              <Button asChild>
                <Link href={resumePath}>
                  <Play size={16} /> {startedAny ? "Continuar" : "Começar"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {isDone && !isStaff && (
        <CertificateCard
          courseId={course.id}
          initialCode={cert?.code ?? null}
          initialPdfUrl={cert?.certificateUrl ?? null}
          hasCpf={hasCpf}
        />
      )}

      {course.total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={28} />
          </div>
          <p className="font-medium text-foreground">
            Este curso ainda não tem aulas.
          </p>
          <p className="text-sm text-muted-foreground">
            O conteúdo aparecerá aqui assim que for publicado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {course.modules.map((module, mIndex) => (
            <section
              key={module.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <div className="border-b border-border px-5 py-4">
                <h2 className="flex items-baseline gap-2 font-semibold text-foreground">
                  <span className="text-sm font-medium text-muted-foreground">
                    Módulo {mIndex + 1}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{module.title}</span>
                </h2>
              </div>

              {module.lessons.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  Nenhuma aula neste módulo.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {module.lessons.map((lesson) => {
                    const duration = fmtDuration(lesson.durationSeconds);

                    // Aula travada (drip/sequencial): não clicável.
                    if (lesson.locked) {
                      const unlockLabel = lesson.unlockAt
                        ? new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }).format(lesson.unlockAt)
                        : null;
                      return (
                        <li key={lesson.id}>
                          <div className="flex items-center gap-3 px-5 py-3.5 opacity-70">
                            <Lock
                              size={20}
                              className="shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                              {lesson.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {unlockLabel
                                ? `Disponível em ${unlockLabel}`
                                : "Conclua a anterior"}
                            </span>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/aprender/${course.slug}/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                        >
                          <span className="shrink-0">
                            {lesson.completed ? (
                              <CheckCircle2 size={20} className="text-teal" aria-hidden />
                            ) : lesson.hasVideo ? (
                              <PlayCircle size={20} className="text-muted-foreground" aria-hidden />
                            ) : (
                              <Circle size={20} className="text-muted-foreground" aria-hidden />
                            )}
                          </span>

                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm font-medium",
                              lesson.completed
                                ? "text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {lesson.title}
                          </span>

                          <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                            {lesson.hasVideo && (
                              <Video size={15} aria-label="Possui vídeo" />
                            )}
                            {lesson.hasDocument && (
                              <FileText size={15} aria-label="Possui PDF" />
                            )}
                            {lesson.hasMaterial && (
                              <FileDown size={15} aria-label="Possui material" />
                            )}
                            {duration && (
                              <span className="text-xs tabular-nums">
                                {duration}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
