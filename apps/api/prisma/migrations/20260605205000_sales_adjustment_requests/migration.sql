-- CreateEnum
CREATE TYPE "SaleAdjustmentRequestType" AS ENUM ('CANCEL_SALE', 'RETURN_ITEMS');

-- CreateEnum
CREATE TYPE "SaleAdjustmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SaleAdjustmentRequest" (
    "id" TEXT NOT NULL,
    "type" "SaleAdjustmentRequestType" NOT NULL,
    "status" "SaleAdjustmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "saleId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reason" TEXT NOT NULL,
    "reviewNote" TEXT,
    "refundMethod" "PaymentMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SaleAdjustmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleAdjustmentRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "productId" TEXT,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "SaleAdjustmentRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleAdjustmentRequest_saleId_idx" ON "SaleAdjustmentRequest"("saleId");
CREATE INDEX "SaleAdjustmentRequest_requestedById_idx" ON "SaleAdjustmentRequest"("requestedById");
CREATE INDEX "SaleAdjustmentRequest_reviewedById_idx" ON "SaleAdjustmentRequest"("reviewedById");
CREATE INDEX "SaleAdjustmentRequest_type_idx" ON "SaleAdjustmentRequest"("type");
CREATE INDEX "SaleAdjustmentRequest_status_idx" ON "SaleAdjustmentRequest"("status");
CREATE INDEX "SaleAdjustmentRequest_createdAt_idx" ON "SaleAdjustmentRequest"("createdAt");
CREATE INDEX "SaleAdjustmentRequest_status_createdAt_idx" ON "SaleAdjustmentRequest"("status", "createdAt");
CREATE INDEX "SaleAdjustmentRequestItem_requestId_idx" ON "SaleAdjustmentRequestItem"("requestId");
CREATE INDEX "SaleAdjustmentRequestItem_saleItemId_idx" ON "SaleAdjustmentRequestItem"("saleItemId");
CREATE INDEX "SaleAdjustmentRequestItem_productId_idx" ON "SaleAdjustmentRequestItem"("productId");

-- AddForeignKey
ALTER TABLE "SaleAdjustmentRequest" ADD CONSTRAINT "SaleAdjustmentRequest_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleAdjustmentRequest" ADD CONSTRAINT "SaleAdjustmentRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleAdjustmentRequest" ADD CONSTRAINT "SaleAdjustmentRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleAdjustmentRequestItem" ADD CONSTRAINT "SaleAdjustmentRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SaleAdjustmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleAdjustmentRequestItem" ADD CONSTRAINT "SaleAdjustmentRequestItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleAdjustmentRequestItem" ADD CONSTRAINT "SaleAdjustmentRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
