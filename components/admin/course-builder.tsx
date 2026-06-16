"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Video,
  FileDown,
  Youtube,
  HardDrive,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LessonDialog } from "./lesson-dialog";
import { ConfirmButton } from "./confirm-button";
import {
  createModule,
  updateModule,
  deleteModule,
  moveModule,
  deleteLesson,
  moveLesson,
} from "@/app/admin/cursos/actions";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  videoProvider: "drive" | "youtube";
  videoRef: string | null;
  materialFileId: string | null;
};
type ModuleT = { id: string; title: string; order: number; lessons: Lesson[] };

function fmtDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60 ? ` ${m % 60}min` : ""}`;
}

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";

export function CourseBuilder({
  courseId,
  modules,
}: {
  courseId: string;
  modules: ModuleT[];
}) {
  const router = useRouter();

  async function run(p: Promise<{ error?: string }>, okMsg?: string) {
    const r = await p;
    if (r?.error) toast.error(r.error);
    else {
      if (okMsg) toast.success(okMsg);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers size={24} />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhum módulo ainda. Comece adicionando o primeiro.
          </p>
        </div>
      )}

      {modules.map((mod, mi) => (
        <div
          key={mod.id}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
        >
          <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
              {mi + 1}
            </span>
            <h3 className="min-w-0 flex-1 truncate font-medium text-foreground">
              {mod.title}
            </h3>
            <div className="flex items-center gap-0.5">
              <button
                className={iconBtn}
                disabled={mi === 0}
                onClick={() => run(moveModule(mod.id, "up"))}
                aria-label="Mover para cima"
              >
                <ChevronUp size={16} />
              </button>
              <button
                className={iconBtn}
                disabled={mi === modules.length - 1}
                onClick={() => run(moveModule(mod.id, "down"))}
                aria-label="Mover para baixo"
              >
                <ChevronDown size={16} />
              </button>
              <ModuleDialog
                mode="edit"
                courseId={courseId}
                moduleId={mod.id}
                initialTitle={mod.title}
              >
                <button className={iconBtn} aria-label="Editar módulo">
                  <Pencil size={15} />
                </button>
              </ModuleDialog>
              <ConfirmButton
                title="Excluir módulo?"
                description={`O módulo "${mod.title}" e suas ${mod.lessons.length} aula(s) serão removidos.`}
                onConfirm={() => run(deleteModule(mod.id), "Módulo excluído")}
              >
                <button
                  className={`${iconBtn} hover:text-destructive`}
                  aria-label="Excluir módulo"
                >
                  <Trash2 size={15} />
                </button>
              </ConfirmButton>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {mod.lessons.map((lesson, li) => {
              const dur = fmtDuration(lesson.durationSeconds);
              return (
                <li
                  key={lesson.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {mi + 1}.{li + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {lesson.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {lesson.videoProvider === "youtube" ? (
                        <Youtube size={12} />
                      ) : (
                        <HardDrive size={12} />
                      )}
                      {lesson.videoRef ? (
                        <Video size={12} className="text-teal" />
                      ) : (
                        <span>sem vídeo</span>
                      )}
                      {lesson.materialFileId && (
                        <FileDown size={12} className="text-teal" />
                      )}
                      {dur && <span>· {dur}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      className={iconBtn}
                      disabled={li === 0}
                      onClick={() => run(moveLesson(lesson.id, "up"))}
                      aria-label="Mover aula para cima"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      className={iconBtn}
                      disabled={li === mod.lessons.length - 1}
                      onClick={() => run(moveLesson(lesson.id, "down"))}
                      aria-label="Mover aula para baixo"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <LessonDialog mode="edit" moduleId={mod.id} lesson={lesson}>
                      <button className={iconBtn} aria-label="Editar aula">
                        <Pencil size={14} />
                      </button>
                    </LessonDialog>
                    <ConfirmButton
                      title="Excluir aula?"
                      description={`A aula "${lesson.title}" será removida.`}
                      onConfirm={() =>
                        run(deleteLesson(lesson.id), "Aula excluída")
                      }
                    >
                      <button
                        className={`${iconBtn} hover:text-destructive`}
                        aria-label="Excluir aula"
                      >
                        <Trash2 size={14} />
                      </button>
                    </ConfirmButton>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border p-3">
            <LessonDialog mode="create" moduleId={mod.id}>
              <Button variant="ghost" size="sm">
                <Plus size={16} /> Adicionar aula
              </Button>
            </LessonDialog>
          </div>
        </div>
      ))}

      <ModuleDialog mode="create" courseId={courseId}>
        <Button variant="secondary" className="w-full">
          <Plus size={18} /> Adicionar módulo
        </Button>
      </ModuleDialog>
    </div>
  );
}

function ModuleDialog({
  mode,
  courseId,
  moduleId,
  initialTitle = "",
  children,
}: {
  mode: "create" | "edit";
  courseId: string;
  moduleId?: string;
  initialTitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(initialTitle);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit() {
    if (title.trim().length < 2) {
      toast.error("Informe o título do módulo");
      return;
    }
    setSaving(true);
    const r =
      mode === "create"
        ? await createModule(courseId, { title })
        : await updateModule(moduleId!, { title });
    setSaving(false);
    if (r?.error) {
      toast.error(r.error);
      return;
    }
    toast.success(mode === "create" ? "Módulo adicionado" : "Módulo atualizado");
    setOpen(false);
    if (mode === "create") setTitle("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo módulo" : "Editar módulo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="module-title">Título do módulo</Label>
          <Input
            id="module-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Fundamentos"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
