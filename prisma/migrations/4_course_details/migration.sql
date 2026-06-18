-- Dados acadêmicos do curso (espelham o Curso do Certimaker, usados no certificado).

-- CreateEnum
CREATE TYPE "CourseModality" AS ENUM ('online', 'presencial', 'hibrido');

-- AlterTable: Course
ALTER TABLE "Course" ADD COLUMN "programContent" TEXT;
ALTER TABLE "Course" ADD COLUMN "workloadHours" INTEGER;
ALTER TABLE "Course" ADD COLUMN "modality" "CourseModality" NOT NULL DEFAULT 'online';
ALTER TABLE "Course" ADD COLUMN "location" TEXT;
