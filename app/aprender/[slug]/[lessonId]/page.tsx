import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { getAuthUser, getCurrentProfile } from "@/lib/auth";
import { getLessonForLearner } from "@/lib/learn";
import { cn } from "@/lib/utils";
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
  const isStaff =
    profile?.role === "admin" || profile?.role === "instructor";

  const data = await getLessonForLearner(user.id, lessonId, isStaff);
  if (!data) notFound();

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Conteúdo principal */}
        <div className="min-w-0">
          <Link
            href={`/aprender/${slug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> {data.courseTitle}
          </Link>
          <LessonView
            lessonId={data.lesson.id}
            courseSlug={slug}
            title={data.lesson.title}
            description={data.lesson.description}
            videoSource={data.videoSource}
            startAt={data.progress.watchedSeconds}
            initialCompleted={data.progress.completed}
            hasMaterial={data.lesson.hasMaterial}
            prevLessonId={data.prevLessonId}
            nextLessonId={data.nextLessonId}
          />
        </div>

        {/* Outline do curso */}
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
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/aprender/${slug}/${l.id}`}
                            className={cn(
                              "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                              current
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                            )}
                          >
                            {l.completed ? (
                              <CheckCircle2
                                size={16}
                                className="shrink-0 text-teal"
                              />
                            ) : current ? (
                              <PlayCircle size={16} className="shrink-0" />
                            ) : (
                              <Circle size={16} className="shrink-0 opacity-50" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </Link>
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
