"use client";

import { useRouter } from "next/navigation";
import { CoursesPage } from "@/components/CoursesPage";
import type { Course } from "@/types";

export default function Page() {
  const router = useRouter();
  return (
    <CoursesPage
      onViewDetails={(course: Course) => router.push(`/cursos/${course.id}`)}
    />
  );
}
