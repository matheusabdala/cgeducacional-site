import { notFound } from "next/navigation";
import { CourseDetailsPage } from "@/components/CourseDetailsPage";
import { getPublishedCourse } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getPublishedCourse(id);
  if (!course) notFound();
  return <CourseDetailsPage course={course} />;
}
