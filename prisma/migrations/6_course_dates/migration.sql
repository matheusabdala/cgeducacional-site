-- Datas oficiais da turma do curso (início/fim). Usadas no certificado quando
-- presentes; senão a emissão cai para as datas de matrícula/conclusão do aluno.

-- AlterTable: Course
ALTER TABLE "Course" ADD COLUMN "startDate" DATE;
ALTER TABLE "Course" ADD COLUMN "endDate" DATE;
