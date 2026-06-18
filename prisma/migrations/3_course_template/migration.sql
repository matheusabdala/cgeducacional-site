-- Modelo de certificado por curso (id do template no Certimaker; null = padrão).
ALTER TABLE "Course" ADD COLUMN "certimakerTemplateId" TEXT;
