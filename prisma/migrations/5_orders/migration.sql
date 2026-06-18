-- Pedidos/compras (Mercado Pago) + carrinhos abandonados.

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('initiated', 'pending', 'approved', 'rejected', 'cancelled', 'refunded');
CREATE TYPE "PaymentMethod" AS ENUM ('pix', 'credit_card');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'initiated',
    "method" "PaymentMethod",
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(10,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "payerCpf" TEXT,
    "payerEmail" TEXT,
    "mpPaymentId" TEXT,
    "mpStatusDetail" TEXT,
    "pixQrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_mpPaymentId_key" ON "Order"("mpPaymentId");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_courseId_idx" ON "Order"("courseId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
