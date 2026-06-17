import { CoursesPage } from "@/components/CoursesPage";
import { getPublishedCourses } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const courses = await getPublishedCourses();
  return <CoursesPage courses={courses} />;
}
