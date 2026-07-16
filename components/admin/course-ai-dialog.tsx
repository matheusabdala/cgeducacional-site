"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  type CourseInput,
} from "@/lib/validations/course";
import {
  generateCourseDraft,
  type CourseDraft,
} from "@/app/admin/cursos/ai-actions";

type FieldKey = keyof CourseDraft;

const FIELD_LABELS: Record<FieldKey, string> = {
  title: "Título",
  description: "Descrição curta",
  fullDescription: "Descrição completa",
  programContent: "Conteúdo programático",
  workloadHours: "Carga horária (h)",
  level: "Nível",
  category: "Categoria",
};

const FIELD_ORDER: FieldKey[] = [
  "title",
  "description",
  "fullDescription",
  "programContent",
  "workloadHours",
  "level",
  "category",
];

function labelFor(key: FieldKey, value: unknown): string {
  if (key === "level") {
    return COURSE_LEVELS.find((l) => l.value === value)?.label ?? String(value);
  }
  if (key === "category") {
    return (
      COURSE_CATEGORIES.find((c) => c.value === value)?.label ?? String(value)
    );
  }
  return String(value ?? "");
}

/** True quando o campo tem valor útil pra oferecer. */
function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function CourseAiDialog({
  onApply,
}: {
  /** Aplica os campos escolhidos aos inputs do formulário de curso. */
  onApply: (fields: Partial<CourseInput>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [hints, setHints] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<CourseDraft | null>(null);
  const [selected, setSelected] = React.useState<Set<FieldKey>>(new Set());

  function reset() {
    setDraft(null);
    setSelected(new Set());
  }

  async function handleGenerate() {
    setLoading(true);
    const res = await generateCourseDraft(hints);
    setLoading(false);
    if (res.error || !res.draft) {
      toast.error(res.error ?? "Não foi possível gerar o rascunho.");
      return;
    }
    const present = FIELD_ORDER.filter((k) => hasValue(res.draft![k]));
    setDraft(res.draft);
    setSelected(new Set(present));
  }

  function toggle(key: FieldKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleApply() {
    if (!draft) return;
    const fields: Partial<CourseInput> = {};
    for (const key of selected) {
      const value = draft[key];
      if (!hasValue(value)) continue;
      // Chaves compatíveis 1:1 com CourseInput.
      (fields as Record<string, unknown>)[key] = value;
    }
    onApply(fields);
    toast.success("Sugestões aplicadas ao formulário.");
    setOpen(false);
    reset();
  }

  const presentFields = draft
    ? FIELD_ORDER.filter((k) => hasValue(draft[k]))
    : [];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Sparkles size={15} className="text-teal-500" />
        Criar com IA
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-teal-500" />
              Criar curso com IA
            </DialogTitle>
            <DialogDescription>
              {draft
                ? "Escolha o que importar. Você pode editar tudo depois no formulário."
                : "Descreva o curso: nome, tópicos, público-alvo… A IA sugere o preenchimento."}
            </DialogDescription>
          </DialogHeader>

          {!draft ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ai-hints">Dicas para a IA</Label>
                <Textarea
                  id="ai-hints"
                  rows={6}
                  autoFocus
                  placeholder={
                    "Ex.: Curso de Neurociência aplicada à alfabetização para professores do fundamental. Abordar plasticidade cerebral, consciência fonológica, estratégias em sala…"
                  }
                  value={hints}
                  onChange={(e) => setHints(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || hints.trim().length < 3}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Gerando…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Gerar sugestões
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {presentFields.map((key) => {
                  const checked = selected.has(key);
                  const value = draft[key];
                  return (
                    <label
                      key={key}
                      className="flex cursor-pointer gap-3 rounded-xl border border-border bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {FIELD_LABELS[key]}
                        </span>
                        <span className="block whitespace-pre-wrap text-sm text-foreground">
                          {labelFor(key, value)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={reset}
                  className="gap-1.5"
                >
                  <ArrowLeft size={15} /> Refazer
                </Button>
                <Button
                  type="button"
                  onClick={handleApply}
                  disabled={selected.size === 0}
                >
                  Aplicar selecionados ({selected.size})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
