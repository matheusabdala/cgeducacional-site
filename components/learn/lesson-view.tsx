"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Download,
  ChevronLeft,
  ChevronRight,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonPlayer } from "@/components/player/lesson-player";
import type { VideoSource } from "@/server/media/types";
import {
  saveProgress,
  markLessonComplete,
  markLessonIncomplete,
} from "@/app/aprender/actions";

export function LessonView({
  lessonId,
  courseSlug,
  title,
  description,
  videoSource,
  startAt,
  initialCompleted,
  hasMaterial,
  prevLessonId,
  nextLessonId,
}: {
  lessonId: string;
  courseSlug: string;
  title: string;
  description: string | null;
  videoSource: VideoSource | null;
  startAt: number;
  initialCompleted: boolean;
  hasMaterial: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = React.useState(initialCompleted);
  const [saving, setSaving] = React.useState(false);

  const posRef = React.useRef(startAt);
  const savedRef = React.useRef(startAt);

  const onProgress = React.useCallback((seconds: number) => {
    posRef.current = seconds;
  }, []);

  // Salva a posição periodicamente e ao sair (resume).
  React.useEffect(() => {
    function flush() {
      if (Math.abs(posRef.current - savedRef.current) < 3) return;
      savedRef.current = posRef.current;
      void saveProgress({ lessonId, watchedSeconds: posRef.current });
    }
    const interval = setInterval(flush, 15000);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [lessonId]);

  async function toggleComplete() {
    const next = !completed;
    setCompleted(next);
    setSaving(true);
    const r = next
      ? await markLessonComplete(lessonId)
      : await markLessonIncomplete(lessonId);
    setSaving(false);
    if (r?.error) {
      toast.error(r.error);
      setCompleted(!next);
      return;
    }
    if (next && r.courseCompleted) {
      toast.success("🎉 Curso concluído! Parabéns.");
    } else {
      toast.success(next ? "Aula concluída" : "Marcada como não concluída");
    }
    router.refresh();
  }

  const onEnded = React.useCallback(() => {
    setCompleted((c) => {
      if (!c) void markLessonComplete(lessonId).then(() => router.refresh());
      return true;
    });
  }, [lessonId, router]);

  return (
    <div className="space-y-5">
      {videoSource ? (
        <LessonPlayer
          source={videoSource}
          startAt={startAt}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 text-muted-foreground">
          <Film size={28} />
          <span className="text-sm">Esta aula ainda não tem vídeo.</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <Button
          onClick={toggleComplete}
          disabled={saving}
          variant={completed ? "secondary" : "default"}
        >
          {completed ? (
            <>
              <CheckCircle2 size={18} className="text-teal" /> Concluída
            </>
          ) : (
            <>
              <Circle size={18} /> Marcar como concluída
            </>
          )}
        </Button>

        {hasMaterial && (
          <a href={`/api/material/${lessonId}`} download>
            <Button variant="outline">
              <Download size={18} /> Material
            </Button>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {prevLessonId ? (
          <Link href={`/aprender/${courseSlug}/${prevLessonId}`}>
            <Button variant="ghost">
              <ChevronLeft size={18} /> Anterior
            </Button>
          </Link>
        ) : (
          <span />
        )}
        {nextLessonId ? (
          <Link href={`/aprender/${courseSlug}/${nextLessonId}`}>
            <Button variant="ghost">
              Próxima <ChevronRight size={18} />
            </Button>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
