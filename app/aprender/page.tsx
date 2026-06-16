import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { getEnrolledCourses } from "@/lib/learn";
import { Button } from "@/components/ui/button";
import { EnrolledCourseCard } from "@/components/learn/enrolled-course-card";

export const dynamic = "force-dynamic";

export default async function AprenderPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const courses = await getEnrolledCourses(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Meus cursos
        </h1>
        <p className="mt-1 text-muted-foreground">
          Continue de onde parou.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap size={28} />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Você ainda não está matriculado em nenhum curso.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore o catálogo e comece a aprender hoje mesmo.
            </p>
          </div>
          <Button asChild>
            <Link href="/cursos">
              Explorar cursos <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <EnrolledCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
