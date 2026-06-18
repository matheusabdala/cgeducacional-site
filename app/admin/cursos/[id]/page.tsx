import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { certimaker } from "@/server/certimaker/client";
import type { CertTemplate } from "@/components/admin/course-form";
import { Badge } from "@/components/ui/badge";
import { CourseForm } from "@/components/admin/course-form";
import { CourseBuilder } from "@/components/admin/course-builder";
import { CourseEditorActions } from "@/components/admin/course-editor-actions";

export const dynamic = "force-dynamic";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) notFound();
  if (profile?.role !== "admin" && course.instructorId !== profile?.id) {
    redirect("/admin/cursos");
  }

  // Modelos do Certimaker p/ o seletor (oculta a seção se indisponível).
  let templates: CertTemplate[] | undefined;
  try {
    templates = await certimaker.listTemplates();
  } catch {
    templates = undefined;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/cursos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Voltar para cursos
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {course.title}
            </h1>
            <Badge variant={course.published ? "default" : "secondary"}>
              {course.published ? "Publicado" : "Rascunho"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.modules.length} módulos ·{" "}
            {course.modules.reduce((n, m) => n + m.lessons.length, 0)} aulas
          </p>
        </div>
        <CourseEditorActions
          id={course.id}
          title={course.title}
          published={course.published}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-semibold text-foreground">Detalhes do curso</h2>
        <CourseForm
          mode="edit"
          courseId={course.id}
          defaultValues={{
            title: course.title,
            description: course.description,
            fullDescription: course.fullDescription ?? "",
            category: course.category,
            level: course.level,
            price: Number(course.price),
            durationLabel: course.durationLabel ?? "",
            thumbnailUrl: course.thumbnailUrl ?? "",
            programContent: course.programContent ?? "",
            workloadHours: course.workloadHours ?? undefined,
            modality: course.modality,
            location: course.location ?? "",
            requireSequential: course.requireSequential,
            dripEnabled: course.dripEnabled,
            dripInitialCount: course.dripInitialCount,
            dripDelayDays: course.dripDelayDays,
            certimakerTemplateId: course.certimakerTemplateId ?? "",
          }}
          templates={templates}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Conteúdo do curso</h2>
          <p className="text-sm text-muted-foreground">
            Organize módulos e aulas. Vídeo via Google Drive (padrão) ou YouTube
            não listado.
          </p>
        </div>
        <CourseBuilder
          courseId={course.id}
          modules={course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            order: m.order,
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description,
              content: l.content,
              durationSeconds: l.durationSeconds,
              videoProvider: l.videoProvider,
              videoRef: l.videoRef,
              documentFileId: l.documentFileId,
              materialFileId: l.materialFileId,
            })),
          }))}
        />
      </section>
    </div>
  );
}
