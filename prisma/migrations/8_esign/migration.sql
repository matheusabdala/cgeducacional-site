-- Assinatura eletrônica de documentos (módulo server/esign). Só cria tabelas novas.

-- CreateEnum
CREATE TYPE "EsignDocumentStatus" AS ENUM ('draft', 'pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EsignSignerStatus" AS ENUM ('pending', 'signed');

-- CreateEnum
CREATE TYPE "EsignFieldKind" AS ENUM ('signature', 'name', 'cpf', 'date');

-- CreateEnum
CREATE TYPE "EsignSignatureMethod" AS ENUM ('draw', 'type', 'phone');

-- CreateEnum
CREATE TYPE "EsignSessionKind" AS ENUM ('upload', 'signature');

-- CreateTable
CREATE TABLE "EsignDocument" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EsignDocumentStatus" NOT NULL DEFAULT 'draft',
    "originalPath" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "originalMime" TEXT NOT NULL DEFAULT 'application/pdf',
    "originalSha256" TEXT NOT NULL,
    "originalSize" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "pageSizes" JSONB NOT NULL,
    "signedPath" TEXT,
    "signedSha256" TEXT,
    "signedVersion" INTEGER NOT NULL DEFAULT 0,
    "requireOtp" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "createdById" UUID NOT NULL,
    "createdByName" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsignDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsignSigner" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,
    "email" TEXT,
    "cpf" TEXT,
    "status" "EsignSignerStatus" NOT NULL DEFAULT 'pending',
    "tokenHash" TEXT,
    "tokenEnc" TEXT,
    "viewedAt" TIMESTAMP(3),
    "signedName" TEXT,
    "signedCpf" TEXT,
    "signedEmail" TEXT,
    "signatureMethod" "EsignSignatureMethod",
    "signaturePath" TEXT,
    "signatureSha256" TEXT,
    "typedText" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedIp" TEXT,
    "signedUserAgent" TEXT,
    "signedDevice" TEXT,
    "signedGeo" JSONB,
    "phoneIp" TEXT,
    "phoneUserAgent" TEXT,
    "phoneDevice" TEXT,
    "otpEmail" TEXT,
    "otpCodeHash" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpSentAt" TIMESTAMP(3),
    "otpSendCount" INTEGER NOT NULL DEFAULT 0,
    "otpVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsignSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsignField" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "kind" "EsignFieldKind" NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "h" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsignField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsignEvent" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT,
    "type" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "data" JSONB,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsignSession" (
    "id" TEXT NOT NULL,
    "kind" "EsignSessionKind" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "documentId" TEXT,
    "signerId" TEXT,
    "actorId" UUID,
    "actorName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "resultPath" TEXT,
    "resultMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsignSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EsignDocument_code_key" ON "EsignDocument"("code");

-- CreateIndex
CREATE INDEX "EsignDocument_status_idx" ON "EsignDocument"("status");

-- CreateIndex
CREATE INDEX "EsignDocument_createdAt_idx" ON "EsignDocument"("createdAt");

-- CreateIndex
CREATE INDEX "EsignDocument_createdById_idx" ON "EsignDocument"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "EsignSigner_tokenHash_key" ON "EsignSigner"("tokenHash");

-- CreateIndex
CREATE INDEX "EsignSigner_documentId_idx" ON "EsignSigner"("documentId");

-- CreateIndex
CREATE INDEX "EsignField_documentId_idx" ON "EsignField"("documentId");

-- CreateIndex
CREATE INDEX "EsignField_signerId_idx" ON "EsignField"("signerId");

-- CreateIndex
CREATE INDEX "EsignEvent_documentId_createdAt_idx" ON "EsignEvent"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EsignSession_codeHash_key" ON "EsignSession"("codeHash");

-- CreateIndex
CREATE INDEX "EsignSession_expiresAt_idx" ON "EsignSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "EsignSigner" ADD CONSTRAINT "EsignSigner_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EsignDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsignField" ADD CONSTRAINT "EsignField_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EsignDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsignField" ADD CONSTRAINT "EsignField_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "EsignSigner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsignEvent" ADD CONSTRAINT "EsignEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EsignDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsignSession" ADD CONSTRAINT "EsignSession_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EsignDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

