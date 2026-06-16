"use client";

import * as React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FieldError } from "@/components/auth/form-bits";
import {
  courseSchema,
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  type CourseInput,
} from "@/lib/validations/course";
import { createCourse, updateCourse } from "@/app/admin/cursos/actions";

const EMPTY: CourseInput = {
  title: "",
  description: "",
  fullDescription: "",
  category: "neurociencia",
  level: "iniciante",
  price: 0,
  durationLabel: "",
  thumbnailUrl: "",
};

export function CourseForm({
  mode,
  courseId,
  defaultValues,
}: {
  mode: "create" | "edit";
  courseId?: string;
  defaultValues?: Partial<CourseInput>;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema) as Resolver<CourseInput>,
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  async function onSubmit(values: CourseInput) {
    const result =
      mode === "create"
        ? await createCourse(values)
        : await updateCourse(courseId!, values);
    if (result?.error) toast.error(result.error);
    else if (mode === "edit") toast.success("Curso atualizado");
    // create redireciona para o editor.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" placeholder="Ex.: Neurociência da Aprendizagem" {...register("title")} />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição curta</Label>
        <Textarea
          id="description"
          rows={2}
          placeholder="Resumo que aparece no card do curso"
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullDescription">Descrição completa</Label>
        <Textarea
          id="fullDescription"
          rows={4}
          placeholder="Detalhes, público-alvo, objetivos…"
          {...register("fullDescription")}
        />
        <FieldError message={errors.fullDescription?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Nível</Label>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
          <FieldError message={errors.price?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="durationLabel">Duração</Label>
          <Input id="durationLabel" placeholder="Ex.: 40h" {...register("durationLabel")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="thumbnailUrl">URL da capa</Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-1.5">
            <Input
              id="thumbnailUrl"
              placeholder="https://…"
              {...register("thumbnailUrl")}
            />
            <FieldError message={errors.thumbnailUrl?.message} />
          </div>
          <ThumbPreview url={watch("thumbnailUrl")} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando…"
            : mode === "create"
              ? "Criar curso"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function ThumbPreview({ url }: { url?: string }) {
  const [error, setError] = React.useState(false);
  React.useEffect(() => setError(false), [url]);
  const valid = url && /^https?:\/\//.test(url);

  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/40 sm:w-44">
      {valid && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Prévia da capa"
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon size={20} />
          Prévia
        </span>
      )}
    </div>
  );
}
