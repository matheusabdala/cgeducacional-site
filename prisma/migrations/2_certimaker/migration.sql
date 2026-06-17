-- CPF do aluno + espelho do Certimaker (integração de certificados).

-- AlterTable: User
ALTER TABLE "User" ADD COLUMN "cpf" TEXT;
ALTER TABLE "User" ADD COLUMN "certimakerAlunoId" TEXT;
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- AlterTable: Course
ALTER TABLE "Course" ADD COLUMN "certimakerCursoId" TEXT;
ALTER TABLE "Course" ADD COLUMN "certimakerTurmaId" TEXT;

-- AlterTable: Certificate
ALTER TABLE "Certificate" ADD COLUMN "code" TEXT;
