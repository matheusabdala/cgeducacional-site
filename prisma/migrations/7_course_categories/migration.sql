-- Novas categorias de curso (importação do catálogo da planilha CG Educacional).
-- ADD VALUE é idempotente com IF NOT EXISTS; não usa os valores na mesma tx.

ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'musica';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'historia';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'artes_visuais';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'seguranca_publica';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'seguranca_trabalho';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'letras';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'hotelaria';
ALTER TYPE "CourseCategory" ADD VALUE IF NOT EXISTS 'outros';
