-- Conteúdo de aula (PDF inline / texto) e liberação de conteúdo por curso.

-- AlterTable: Lesson
ALTER TABLE "Lesson" ADD COLUMN "content" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "documentFileId" TEXT;

-- AlterTable: Course (gating)
ALTER TABLE "Course" ADD COLUMN "requireSequential" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "dripEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "dripInitialCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "dripDelayDays" INTEGER NOT NULL DEFAULT 7;
