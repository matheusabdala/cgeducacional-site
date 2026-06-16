"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { enrollUserInCourse, removeEnrollment } from "@/app/admin/alunos/actions";

type Course = { id: string; title: string };

/**
 * Seletor de curso + botão "Matricular". Lista apenas cursos onde o aluno ainda
 * não está matriculado (`availableCourses`).
 */
export function EnrollControls({
  userId,
  availableCourses,
}: {
  userId: string;
  availableCourses: Course[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = React.useState<string>("");
  const [pending, startTransition] = React.useTransition();

  if (availableCourses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este aluno já está matriculado em todos os cursos disponíveis.
      </p>
    );
  }

  function handleEnroll() {
    if (!courseId) {
      toast.error("Selecione um curso.");
      return;
    }
    startTransition(async () => {
      const r = await enrollUserInCourse(userId, courseId);
      if (r?.error) {
        toast.error(r.error);
      } else {
        toast.success("Aluno matriculado no curso.");
        setCourseId("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Select value={courseId} onValueChange={setCourseId} disabled={pending}>
          <SelectTrigger aria-label="Selecione um curso para matricular">
            <SelectValue placeholder="Selecione um curso…" />
          </SelectTrigger>
          <SelectContent>
            {availableCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={handleEnroll} disabled={pending || !courseId}>
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Plus size={16} />
        )}
        Matricular
      </Button>
    </div>
  );
}

/**
 * Botão de remover matrícula, com confirmação via AlertDialog.
 */
export function RemoveEnrollmentButton({
  userId,
  courseId,
  courseTitle,
}: {
  userId: string;
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleRemove() {
    startTransition(async () => {
      const r = await removeEnrollment(userId, courseId);
      if (r?.error) {
        toast.error(r.error);
      } else {
        toast.success("Matrícula removida.");
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          aria-label={`Remover matrícula de ${courseTitle}`}
          className="text-muted-foreground hover:text-destructive"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover matrícula?</AlertDialogTitle>
          <AlertDialogDescription>
            O aluno perderá o acesso ao curso{" "}
            <span className="font-medium text-foreground">{courseTitle}</span>. O
            progresso registrado também será removido. Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove}>
            Remover matrícula
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
