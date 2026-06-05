-- CreateEnum
CREATE TYPE "InventoryTransferRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "InventoryTransferRequest" (
    "id" TEXT NOT NULL,
    "status" "InventoryTransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reason" TEXT NOT NULL,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransferRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "InventoryTransferRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_fromWarehouseId_idx" ON "InventoryTransferRequest"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_toWarehouseId_idx" ON "InventoryTransferRequest"("toWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_requestedById_idx" ON "InventoryTransferRequest"("requestedById");

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_reviewedById_idx" ON "InventoryTransferRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_status_idx" ON "InventoryTransferRequest"("status");

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_createdAt_idx" ON "InventoryTransferRequest"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryTransferRequest_status_createdAt_idx" ON "InventoryTransferRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryTransferRequestItem_requestId_idx" ON "InventoryTransferRequestItem"("requestId");

-- CreateIndex
CREATE INDEX "InventoryTransferRequestItem_productId_idx" ON "InventoryTransferRequestItem"("productId");

-- AddForeignKey
ALTER TABLE "InventoryTransferRequest" ADD CONSTRAINT "InventoryTransferRequest_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferRequest" ADD CONSTRAINT "InventoryTransferRequest_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferRequest" ADD CONSTRAINT "InventoryTransferRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferRequest" ADD CONSTRAINT "InventoryTransferRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferRequestItem" ADD CONSTRAINT "InventoryTransferRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InventoryTransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferRequestItem" ADD CONSTRAINT "InventoryTransferRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
