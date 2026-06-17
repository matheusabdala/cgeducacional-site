import HomePage from "@/components/HomePage";
import { getPublishedCourses } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const courses = await getPublishedCourses();
  return <HomePage featuredCourses={courses.slice(0, 4)} />;
}
