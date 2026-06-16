"use client";

import { useRouter } from "next/navigation";
import { notFound, useParams } from "next/navigation";
import { CourseDetailsPage } from "@/components/CourseDetailsPage";
import { COURSES } from "@/constants";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const course = COURSES.find((c) => c.id === params.id);

  if (!course) {
    notFound();
  }

  return (
    <CourseDetailsPage course={course} onBack={() => router.push("/cursos")} />
  );
}
