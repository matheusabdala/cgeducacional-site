"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createLesson, updateLesson } from "@/app/admin/cursos/actions";

type LessonData = {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  videoProvider: "drive" | "youtube";
  videoRef: string | null;
  materialFileId: string | null;
};

export function LessonDialog({
  mode,
  moduleId,
  lesson,
  children,
}: {
  mode: "create" | "edit";
  moduleId: string;
  lesson?: LessonData;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [title, setTitle] = React.useState(lesson?.title ?? "");
  const [description, setDescription] = React.useState(lesson?.description ?? "");
  const [durationMin, setDurationMin] = React.useState(
    lesson?.durationSeconds ? Math.round(lesson.durationSeconds / 60) : "",
  );
  const [provider, setProvider] = React.useState<"drive" | "youtube">(
    lesson?.videoProvider ?? "drive",
  );
  const [videoRef, setVideoRef] = React.useState(lesson?.videoRef ?? "");
  const [materialFileId, setMaterialFileId] = React.useState(
    lesson?.materialFileId ?? "",
  );

  function reset() {
    if (mode === "create") {
      setTitle("");
      setDescription("");
      setDurationMin("");
      setProvider("drive");
      setVideoRef("");
      setMaterialFileId("");
    }
  }

  async function uploadTo(setter: (id: string) => void, file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Falha no upload");
    setter(json.id);
    return json.name as string;
  }

  async function onSubmit() {
    if (title.trim().length < 2) {
      toast.error("Informe o título da aula");
      return;
    }
    setSaving(true);
    const values = {
      title,
      description,
      durationSeconds: durationMin ? Number(durationMin) * 60 : undefined,
      videoProvider: provider,
      videoRef,
      materialFileId,
    };
    const result =
      mode === "create"
        ? await createLesson(moduleId, values)
        : await updateLesson(lesson!.id, values);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(mode === "create" ? "Aula adicionada" : "Aula atualizada");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova aula" : "Editar aula"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">Título</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Introdução ao tema"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-desc">Descrição</Label>
              <Textarea
                id="lesson-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-dur">Duração (min)</Label>
              <Input
                id="lesson-dur"
                type="number"
                min="0"
                className="w-28"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fonte do vídeo</Label>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as "drive" | "youtube")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drive">Google Drive (padrão)</SelectItem>
                <SelectItem value="youtube">YouTube (não listado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lesson-ref">
              {provider === "drive" ? "ID do arquivo no Drive" : "ID do vídeo no YouTube"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="lesson-ref"
                value={videoRef}
                onChange={(e) => setVideoRef(e.target.value)}
                placeholder={provider === "drive" ? "file id" : "videoId"}
              />
              {provider === "drive" && (
                <UploadButton
                  label="Enviar vídeo"
                  accept="video/*"
                  onUpload={(f) =>
                    uploadTo(setVideoRef, f).then((name) =>
                      toast.success(`Vídeo enviado: ${name}`),
                    )
                  }
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lesson-material">Material para download (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="lesson-material"
                value={materialFileId}
                onChange={(e) => setMaterialFileId(e.target.value)}
                placeholder="ID do arquivo no Drive"
              />
              <UploadButton
                label="Enviar material"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                onUpload={(f) =>
                  uploadTo(setMaterialFileId, f).then((name) =>
                    toast.success(`Material enviado: ${name}`),
                  )
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
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

function UploadButton({
  label,
  accept,
  onUpload,
}: {
  label: string;
  accept: string;
  onUpload: (file: File) => Promise<unknown>;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="shrink-0"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title={label}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handle}
      />
    </>
  );
}
