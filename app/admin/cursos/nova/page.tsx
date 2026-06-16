import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";

export const dynamic = "force-dynamic";

export default function NovoCursoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/cursos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Voltar para cursos
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Novo curso
        </h1>
        <p className="mt-1 text-muted-foreground">
          Crie o curso e depois adicione módulos e aulas.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <CourseForm mode="create" />
      </div>
    </div>
  );
}
