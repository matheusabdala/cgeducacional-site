"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, Check } from "lucide-react";
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
import { uploadFileWithProgress } from "@/lib/upload";

type LessonData = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  durationSeconds: number | null;
  videoProvider: "drive" | "youtube";
  videoRef: string | null;
  documentFileId: string | null;
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
    lesson?.durationSeconds ? String(Math.round(lesson.durationSeconds / 60)) : "",
  );
  const [provider, setProvider] = React.useState<"drive" | "youtube">(
    lesson?.videoProvider ?? "drive",
  );
  const [videoRef, setVideoRef] = React.useState(lesson?.videoRef ?? "");
  const [documentFileId, setDocumentFileId] = React.useState(
    lesson?.documentFileId ?? "",
  );
  const [content, setContent] = React.useState(lesson?.content ?? "");
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
      setDocumentFileId("");
      setContent("");
      setMaterialFileId("");
    }
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
      content,
      durationSeconds: durationMin ? Number(durationMin) * 60 : undefined,
      videoProvider: provider,
      videoRef,
      documentFileId,
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

          <UploadField
            label={provider === "drive" ? "ID do arquivo no Drive" : "ID do vídeo no YouTube"}
            value={videoRef}
            onChange={setVideoRef}
            placeholder={provider === "drive" ? "file id" : "videoId"}
            uploadable={provider === "drive"}
            accept="video/*"
            uploadLabel="Enviar vídeo"
          />

          <UploadField
            label="Documento da aula — PDF (opcional, exibido na aula)"
            value={documentFileId}
            onChange={setDocumentFileId}
            placeholder="ID do PDF no Drive"
            uploadable
            accept=".pdf"
            uploadLabel="Enviar PDF"
          />

          <div className="space-y-1.5">
            <Label htmlFor="lesson-content">Conteúdo escrito (opcional)</Label>
            <Textarea
              id="lesson-content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Texto da aula — para aulas escritas, sem vídeo…"
            />
          </div>

          <UploadField
            label="Material para download (opcional)"
            value={materialFileId}
            onChange={setMaterialFileId}
            placeholder="ID do arquivo no Drive"
            uploadable
            accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
            uploadLabel="Enviar material"
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

function UploadField({
  label,
  value,
  onChange,
  placeholder,
  uploadable,
  accept,
  uploadLabel,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  uploadable: boolean;
  accept: string;
  uploadLabel: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pct, setPct] = React.useState<number | null>(null);
  const [done, setDone] = React.useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(false);
    setPct(0);
    try {
      const res = await uploadFileWithProgress(file, setPct);
      onChange(res.id);
      setDone(true);
      toast.success(`Enviado: ${res.name}`);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setPct(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploading = pct !== null;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={done ? "pr-9" : undefined}
          />
          {done && (
            <Check
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-teal"
            />
          )}
        </div>
        {uploadable && (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            title={uploadLabel}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}
