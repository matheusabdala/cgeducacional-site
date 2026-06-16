import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
} from "lucide-react";
import { getAuthUser, getCurrentProfile } from "@/lib/auth";
import { getLessonForLearner } from "@/lib/learn";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LessonView } from "@/components/learn/lesson-view";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const user = await getAuthUser();
  if (!user) notFound();

  const profile = await getCurrentProfile();
  const isStaff = profile?.role === "admin" || profile?.role === "instructor";

  const data = await getLessonForLearner(user.id, lessonId, isStaff);
  if (!data) notFound();

  const unlockLabel = data.lock.unlockAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(data.lock.unlockAt)
    : null;

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Link
            href={`/aprender/${slug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> {data.courseTitle}
          </Link>

          {data.lock.locked ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-12 text-center shadow-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Lock size={28} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {data.lesson.title}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {unlockLabel
                    ? `Esta aula libera em ${unlockLabel}.`
                    : "Conclua as aulas anteriores para liberar esta."}
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href={`/aprender/${slug}`}>Voltar ao curso</Link>
              </Button>
            </div>
          ) : (
            <LessonView
              lessonId={data.lesson.id}
              courseSlug={slug}
              title={data.lesson.title}
              description={data.lesson.description}
              content={data.lesson.content}
              videoSource={data.videoSource}
              hasDocument={data.lesson.hasDocument}
              startAt={data.progress.watchedSeconds}
              initialCompleted={data.progress.completed}
              hasMaterial={data.lesson.hasMaterial}
              prevLessonId={data.prevLessonId}
              nextLessonId={data.nextLessonId}
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Conteúdo do curso
              </h2>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {data.outline.map((mod, mi) => (
                <div key={mi} className="border-b border-border last:border-0">
                  <p className="bg-secondary/30 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {mi + 1}. {mod.moduleTitle}
                  </p>
                  <ul>
                    {mod.lessons.map((l) => {
                      const current = l.id === data.lesson.id;
                      const icon = l.completed ? (
                        <CheckCircle2 size={16} className="shrink-0 text-teal" />
                      ) : l.locked ? (
                        <Lock size={16} className="shrink-0 opacity-50" />
                      ) : current ? (
                        <PlayCircle size={16} className="shrink-0" />
                      ) : (
                        <Circle size={16} className="shrink-0 opacity-50" />
                      );
                      const cls = cn(
                        "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                        current
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground",
                      );
                      return (
                        <li key={l.id}>
                          {l.locked ? (
                            <div className={cn(cls, "opacity-70")}>
                              {icon}
                              <span className="truncate">{l.title}</span>
                            </div>
                          ) : (
                            <Link
                              href={`/aprender/${slug}/${l.id}`}
                              className={cn(
                                cls,
                                !current && "hover:bg-muted/40 hover:text-foreground",
                              )}
                            >
                              {icon}
                              <span className="truncate">{l.title}</span>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
