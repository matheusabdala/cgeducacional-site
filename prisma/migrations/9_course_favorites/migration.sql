-- Favoritos de curso no painel admin (estrela por usuário, usada como filtro).

-- CreateTable
CREATE TABLE "CourseFavorite" (
    "userId" UUID NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseFavorite_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateIndex
CREATE INDEX "CourseFavorite_courseId_idx" ON "CourseFavorite"("courseId");

-- AddForeignKey
ALTER TABLE "CourseFavorite" ADD CONSTRAINT "CourseFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFavorite" ADD CONSTRAINT "CourseFavorite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: acesso só pelo servidor (Prisma); dono lê/escreve os próprios.
ALTER TABLE "CourseFavorite" ENABLE ROW LEVEL SECURITY;
