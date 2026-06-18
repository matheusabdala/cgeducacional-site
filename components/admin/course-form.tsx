"use client";

import * as React from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Image as ImageIcon, Lock, Award, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
import {
  createCourse,
  updateCourse,
  openCertimakerCreator,
} from "@/app/admin/cursos/actions";

export type CertTemplate = { id: string; name: string; isPreset?: boolean };

const EMPTY: CourseInput = {
  title: "",
  description: "",
  fullDescription: "",
  category: "neurociencia",
  level: "iniciante",
  price: 0,
  durationLabel: "",
  thumbnailUrl: "",
  requireSequential: false,
  dripEnabled: false,
  dripInitialCount: 0,
  dripDelayDays: 7,
  certimakerTemplateId: "",
};

export function CourseForm({
  mode,
  courseId,
  defaultValues,
  templates,
}: {
  mode: "create" | "edit";
  courseId?: string;
  defaultValues?: Partial<CourseInput>;
  /** Modelos do Certimaker; ausente = seção de certificado oculta. */
  templates?: CertTemplate[];
}) {
  const [openingCreator, setOpeningCreator] = React.useState(false);
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

  async function handleOpenCreator() {
    // Abre a aba já no clique (evita bloqueio de popup) e navega após o SSO.
    const win = window.open("about:blank", "_blank");
    setOpeningCreator(true);
    const res = await openCertimakerCreator();
    setOpeningCreator(false);
    if (res.error || !res.url) {
      win?.close();
      toast.error(res.error ?? "Não foi possível abrir o Certimaker");
      return;
    }
    if (win) win.location.href = res.url;
    else window.open(res.url, "_blank");
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

      {/* Liberação de conteúdo (opcional) */}
      <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lock size={16} className="text-muted-foreground" /> Liberação de
          conteúdo
        </div>

        <label className="flex items-start justify-between gap-4">
          <span className="space-y-0.5">
            <span className="block text-sm font-medium text-foreground">
              Exigir conclusão em ordem
            </span>
            <span className="block text-xs text-muted-foreground">
              O aluno só abre a próxima aula após concluir a anterior.
            </span>
          </span>
          <Controller
            control={control}
            name="requireSequential"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </label>

        <div className="border-t border-border pt-4">
          <label className="flex items-start justify-between gap-4">
            <span className="space-y-0.5">
              <span className="block text-sm font-medium text-foreground">
                Liberação programada (drip)
              </span>
              <span className="block text-xs text-muted-foreground">
                Libera algumas aulas na hora e o restante após X dias da
                matrícula — útil contra reembolso (7 dias).
              </span>
            </span>
            <Controller
              control={control}
              name="dripEnabled"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </label>

          {watch("dripEnabled") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dripInitialCount">
                  Liberar de imediato (nº de aulas)
                </Label>
                <Input
                  id="dripInitialCount"
                  type="number"
                  min="0"
                  {...register("dripInitialCount")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dripDelayDays">
                  Liberar o restante após (dias)
                </Label>
                <Input
                  id="dripDelayDays"
                  type="number"
                  min="0"
                  {...register("dripDelayDays")}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificado (modelo por curso + atalho ao criador do Certimaker) */}
      {templates && (
        <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Award size={16} className="text-muted-foreground" /> Certificado
          </div>

          <div className="space-y-1.5">
            <Label>Modelo do certificado</Label>
            <Controller
              control={control}
              name="certimakerTemplateId"
              render={({ field }) => (
                <Select
                  value={field.value || "__default__"}
                  onValueChange={(v) =>
                    field.onChange(v === "__default__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Padrão (automático)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">
                      Padrão (automático)
                    </SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.isPreset ? " · preset" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Modelo usado ao emitir o certificado deste curso. “Padrão” deixa o
              Certimaker escolher.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenCreator}
            disabled={openingCreator}
            className="gap-2"
          >
            <ExternalLink size={15} />
            {openingCreator ? "Abrindo…" : "Criar/editar modelos no Certimaker"}
          </Button>
        </div>
      )}

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
