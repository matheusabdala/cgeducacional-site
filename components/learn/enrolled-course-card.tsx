import Link from "next/link";
import { BookOpen, CheckCircle2, Play, RotateCcw } from "lucide-react";
import type { EnrolledCourse } from "@/lib/learn";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Card de curso matriculado para o dashboard do aluno. O thumbnail/título levam
 * à página do curso; o botão principal retoma (ou revisa) a partir da aula certa.
 */
export function EnrolledCourseCard({ course }: { course: EnrolledCourse }) {
  const isDone = course.completedAt != null || course.percent === 100;
  const coursePath = `/aprender/${course.slug}`;
  const resumePath = course.resumeLessonId
    ? `/aprender/${course.slug}/${course.resumeLessonId}`
    : coursePath;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card",
        "transition-all duration-300 ease-expo-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover",
      )}
    >
      <Link
        href={coursePath}
        className="relative block aspect-video overflow-hidden bg-secondary/30"
        aria-label={`Abrir curso ${course.title}`}
      >
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={`Capa do curso ${course.title}`}
            className="h-full w-full object-cover transition-transform duration-500 ease-expo-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/40">
            <BookOpen size={40} />
          </div>
        )}
        {isDone && (
          <div className="absolute right-3 top-3">
            <Badge variant="teal">
              <CheckCircle2 size={14} /> Concluído
            </Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <Link href={coursePath} className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
            {course.title}
          </h3>
        </Link>

        <div className="mt-auto space-y-2">
          <Progress value={course.percent} />
          <p className="text-xs text-muted-foreground">
            {course.percent}% · {course.done}/{course.total} aula
            {course.total === 1 ? "" : "s"}
          </p>
        </div>

        <Button asChild className="w-full" variant={isDone ? "secondary" : "default"}>
          <Link href={resumePath}>
            {isDone ? (
              <>
                <RotateCcw size={16} /> Revisar
              </>
            ) : (
              <>
                <Play size={16} /> Continuar
              </>
            )}
          </Link>
        </Button>
      </div>
    </div>
  );
}
