"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  FileDown,
  Youtube,
  HardDrive,
  Layers,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  deleteLesson,
  reorderModules,
  reorderLessons,
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
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30";

const dragHandle =
  "flex h-7 w-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 transition-colors hover:text-foreground active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CourseBuilder({
  courseId,
  modules,
}: {
  courseId: string;
  modules: ModuleT[];
}) {
  const router = useRouter();
  const [mods, setMods] = React.useState(modules);
  React.useEffect(() => setMods(modules), [modules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onModulesDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const prev = mods;
    const oldI = prev.findIndex((m) => m.id === active.id);
    const newI = prev.findIndex((m) => m.id === over.id);
    const next = arrayMove(prev, oldI, newI);
    setMods(next);
    reorderModules(
      courseId,
      next.map((m) => m.id),
    ).then((r) => {
      if (r?.error) {
        toast.error(r.error);
        setMods(prev);
      }
    });
  }

  function onLessonsDragEnd(moduleId: string, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const prev = mods;
    const mod = prev.find((m) => m.id === moduleId);
    if (!mod) return;
    const oldI = mod.lessons.findIndex((l) => l.id === active.id);
    const newI = mod.lessons.findIndex((l) => l.id === over.id);
    const newLessons = arrayMove(mod.lessons, oldI, newI);
    setMods(prev.map((m) => (m.id === moduleId ? { ...m, lessons: newLessons } : m)));
    reorderLessons(
      moduleId,
      newLessons.map((l) => l.id),
    ).then((r) => {
      if (r?.error) {
        toast.error(r.error);
        setMods(prev);
      }
    });
  }

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
      {mods.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers size={24} />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhum módulo ainda. Comece adicionando o primeiro.
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onModulesDragEnd}
      >
        <SortableContext
          items={mods.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {mods.map((mod, mi) => (
              <SortableModuleCard
                key={mod.id}
                mod={mod}
                index={mi}
                courseId={courseId}
                sensors={sensors}
                onLessonsDragEnd={onLessonsDragEnd}
                onDeleteModule={() =>
                  run(deleteModule(mod.id), "Módulo excluído")
                }
                onDeleteLesson={(lessonId) =>
                  run(deleteLesson(lessonId), "Aula excluída")
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ModuleDialog mode="create" courseId={courseId}>
        <Button variant="secondary" className="w-full">
          <Plus size={18} /> Adicionar módulo
        </Button>
      </ModuleDialog>
    </div>
  );
}

function SortableModuleCard({
  mod,
  index,
  courseId,
  sensors,
  onLessonsDragEnd,
  onDeleteModule,
  onDeleteLesson,
}: {
  mod: ModuleT;
  index: number;
  courseId: string;
  sensors: ReturnType<typeof useSensors>;
  onLessonsDragEnd: (moduleId: string, e: DragEndEvent) => void;
  onDeleteModule: () => void;
  onDeleteLesson: (lessonId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-card ${
        isDragging ? "z-10 opacity-80 shadow-card-hover" : ""
      }`}
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-3 py-3">
        <button
          className={dragHandle}
          {...attributes}
          {...listeners}
          aria-label="Arrastar módulo"
        >
          <GripVertical size={16} />
        </button>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <h3 className="min-w-0 flex-1 truncate font-medium text-foreground">
          {mod.title}
        </h3>
        <div className="flex items-center gap-0.5">
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
            onConfirm={onDeleteModule}
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => onLessonsDragEnd(mod.id, e)}
      >
        <SortableContext
          items={mod.lessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y divide-border">
            {mod.lessons.map((lesson, li) => (
              <SortableLessonRow
                key={lesson.id}
                lesson={lesson}
                label={`${index + 1}.${li + 1}`}
                moduleId={mod.id}
                onDelete={() => onDeleteLesson(lesson.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="border-t border-border p-3">
        <LessonDialog mode="create" moduleId={mod.id}>
          <Button variant="ghost" size="sm">
            <Plus size={16} /> Adicionar aula
          </Button>
        </LessonDialog>
      </div>
    </div>
  );
}

function SortableLessonRow({
  lesson,
  label,
  moduleId,
  onDelete,
}: {
  lesson: Lesson;
  label: string;
  moduleId: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id });
  const dur = fmtDuration(lesson.durationSeconds);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-card px-3 py-2.5 ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <button
        className={dragHandle}
        {...attributes}
        {...listeners}
        aria-label="Arrastar aula"
      >
        <GripVertical size={14} />
      </button>
      <span className="text-xs tabular-nums text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{lesson.title}</p>
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
          {lesson.materialFileId && <FileDown size={12} className="text-teal" />}
          {dur && <span>· {dur}</span>}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <LessonDialog mode="edit" moduleId={moduleId} lesson={lesson}>
          <button className={iconBtn} aria-label="Editar aula">
            <Pencil size={14} />
          </button>
        </LessonDialog>
        <ConfirmButton
          title="Excluir aula?"
          description={`A aula "${lesson.title}" será removida.`}
          onConfirm={onDelete}
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
