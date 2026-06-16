"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { togglePublish, deleteCourse } from "@/app/admin/cursos/actions";

export function CourseEditorActions({
  id,
  title,
  published,
}: {
  id: string;
  title: string;
  published: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = React.useState(published);

  async function onToggle(value: boolean) {
    setChecked(value);
    const r = await togglePublish(id, value);
    if (r?.error) {
      toast.error(r.error);
      setChecked(!value);
    } else {
      toast.success(value ? "Curso publicado" : "Curso despublicado");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Switch checked={checked} onCheckedChange={onToggle} />
        <span className="text-muted-foreground">
          {checked ? "Publicado" : "Rascunho"}
        </span>
      </label>
      <ConfirmButton
        title="Excluir curso?"
        description={`O curso "${title}" e todo o seu conteúdo e matrículas serão removidos permanentemente.`}
        onConfirm={async () => {
          const r = await deleteCourse(id);
          if (r?.error) toast.error(r.error);
          else toast.success("Curso excluído");
        }}
      >
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 size={16} /> Excluir
        </Button>
      </ConfirmButton>
    </div>
  );
}
