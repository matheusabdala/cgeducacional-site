import Link from "next/link";
import { AREAS, LEVELS, type FeaturedCourse } from "@/lib/v2/areas";
import { SALES_OPEN, SALES_SOON } from "@/lib/sales";
import styles from "./CourseCard.module.css";

/**
 * Card de curso, um formato só para o site inteiro.
 *
 * Curso não publicado não tem página (`/cursos/[id]` devolve 404), então nesse
 * caso o card não é link.
 */
export function CourseCard({ course }: { course: FeaturedCourse }) {
  const body = (
    <>
      <div className={styles.cover}>
        <span className={styles.coverLabel}>{AREAS[course.area]}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.desc}>{course.description}</p>
        <p className={styles.meta}>
          {course.duration || (course.hours ? `${course.hours}h` : "carga a definir")}
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          {LEVELS[course.level]}
          {!course.live ? (
            <span className={styles.tag}>Em preparação</span>
          ) : (
            !SALES_OPEN && <span className={styles.tag}>{SALES_SOON}</span>
          )}
        </p>
      </div>
    </>
  );

  if (!course.live) {
    return (
      <article className={styles.card} data-area={course.area}>
        {body}
      </article>
    );
  }
  return (
    <Link href={`/cursos/${course.id}`} className={styles.card} data-area={course.area}>
      {body}
    </Link>
  );
}
