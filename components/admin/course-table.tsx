"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CourseRowActions } from "@/components/admin/course-row-actions";
import {
  bulkSetPublished,
  bulkDeleteCourses,
  toggleFavorite,
} from "@/app/admin/cursos/actions";

export type CourseTableRow = {
  id: string;
  title: string;
  categoryLabel: string;
  modules: number;
  students: number;
  priceLabel: string;
  published: boolean;
  favorite: boolean;
};

const plural = (n: number) => (n === 1 ? "curso" : "cursos");

export function CourseTable({ courses }: { courses: CourseTableRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  // Estado otimista da estrela até o refresh do servidor chegar.
  const [favOverride, setFavOverride] = React.useState<Record<string, boolean>>(
    {},
  );

  // Ao trocar de página/filtro, descarta ids que não estão mais na tela.
  const rowIds = courses.map((c) => c.id).join(",");
  React.useEffect(() => {
    const visible = new Set(rowIds.split(","));
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setFavOverride({});
  }, [rowIds]);

  const allSelected = courses.length > 0 && selected.size === courses.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(courses.map((c) => c.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function onBulkPublish(published: boolean) {
    setBusy(true);
    const r = await bulkSetPublished([...selected], published);
    setBusy(false);
    if (r.error) return toast.error(r.error);
    toast.success(
      `${r.count} ${plural(r.count ?? 0)} ${published ? "publicado" : "despublicado"}${r.count === 1 ? "" : "s"}`,
    );
    setSelected(new Set());
    router.refresh();
  }

  async function onBulkDelete() {
    setBusy(true);
    const r = await bulkDeleteCourses([...selected]);
    setBusy(false);
    setConfirmOpen(false);
    if (r.error) return toast.error(r.error);
    toast.success(
      `${r.count} ${plural(r.count ?? 0)} excluído${r.count === 1 ? "" : "s"}`,
    );
    setSelected(new Set());
    router.refresh();
  }

  async function onFavorite(id: string, favorite: boolean) {
    setFavOverride((prev) => ({ ...prev, [id]: favorite }));
    const r = await toggleFavorite(id, favorite);
    if (r?.error) {
      setFavOverride((prev) => ({ ...prev, [id]: !favorite }));
      toast.error(r.error);
      return;
    }
    router.refresh();
  }

  const selectedCourses = courses.filter((c) => selected.has(c.id));

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div
          role="toolbar"
          aria-label="Ações em massa"
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <span className="mr-auto text-sm font-medium text-foreground">
            {selected.size} {selected.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onBulkPublish(true)}
          >
            <Eye size={16} /> Publicar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onBulkPublish(false)}
          >
            <EyeOff size={16} /> Despublicar
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
            aria-label="Excluir selecionados"
            title="Excluir selecionados"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={() => setSelected(new Set())}
            aria-label="Limpar seleção"
            title="Limpar seleção"
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pr-0">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Selecionar todos da página"
                />
              </TableHead>
              <TableHead>Curso</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="hidden sm:table-cell">Conteúdo</TableHead>
              <TableHead className="hidden lg:table-cell">Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => {
              const isSelected = selected.has(c.id);
              const favorite = favOverride[c.id] ?? c.favorite;
              return (
                <TableRow
                  key={c.id}
                  data-state={isSelected ? "selected" : undefined}
                >
                  <TableCell className="pr-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => toggleOne(c.id, v === true)}
                      aria-label={`Selecionar ${c.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onFavorite(c.id, !favorite)}
                        aria-pressed={favorite}
                        aria-label={
                          favorite
                            ? `Remover ${c.title} dos favoritos`
                            : `Favoritar ${c.title}`
                        }
                        title={favorite ? "Remover dos favoritos" : "Favoritar"}
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          favorite
                            ? "text-amber-500"
                            : "text-muted-foreground/50 hover:text-amber-500",
                        )}
                      >
                        <Star
                          size={16}
                          className={cn(
                            "transition-transform duration-200",
                            favorite && "scale-110 fill-current",
                          )}
                        />
                      </button>
                      <Link
                        href={`/admin/cursos/${c.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {c.title}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {c.categoryLabel}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {c.modules} mód · {c.students} alunos
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {c.priceLabel}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.published ? "default" : "secondary"}>
                      {c.published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CourseRowActions
                      id={c.id}
                      title={c.title}
                      published={c.published}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {selected.size} {plural(selected.size)}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Os cursos abaixo e todos os seus módulos, aulas e matrículas
                  serão removidos permanentemente. Esta ação não pode ser
                  desfeita.
                </p>
                <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-foreground">
                  {selectedCourses.map((c) => (
                    <li key={c.id}>{c.title}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onBulkDelete();
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
