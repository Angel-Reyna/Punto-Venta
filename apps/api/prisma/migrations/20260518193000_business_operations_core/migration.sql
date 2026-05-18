-- Business operations core: cash register sessions, returns and operational reporting support.

ALTER TYPE "SaleStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';

CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "CashMovementType" AS ENUM ('OPENING', 'CASH_IN', 'CASH_OUT', 'SALE_CASH', 'RETURN_CASH');

CREATE TABLE "SaleReturn" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "cashierId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "refundMethod" "PaymentMethod" NOT NULL,
  "refundTotal" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SaleReturn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleReturnItem" (
  "id" TEXT NOT NULL,
  "returnId" TEXT NOT NULL,
  "saleItemId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,

  CONSTRAINT "SaleReturnItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashRegisterSession" (
  "id" TEXT NOT NULL,
  "cashierId" TEXT NOT NULL,
  "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
  "openingAmount" DECIMAL(12,2) NOT NULL,
  "expectedClosingAmount" DECIMAL(12,2),
  "closingAmount" DECIMAL(12,2),
  "difference" DECIMAL(12,2),
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CashRegisterSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "cashierId" TEXT NOT NULL,
  "saleId" TEXT,
  "saleReturnId" TEXT,
  "type" "CashMovementType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SaleReturn_saleId_idx" ON "SaleReturn"("saleId");
CREATE INDEX "SaleReturn_cashierId_idx" ON "SaleReturn"("cashierId");
CREATE INDEX "SaleReturn_refundMethod_idx" ON "SaleReturn"("refundMethod");
CREATE INDEX "SaleReturn_createdAt_idx" ON "SaleReturn"("createdAt");

CREATE INDEX "SaleReturnItem_returnId_idx" ON "SaleReturnItem"("returnId");
CREATE INDEX "SaleReturnItem_saleItemId_idx" ON "SaleReturnItem"("saleItemId");
CREATE INDEX "SaleReturnItem_productId_idx" ON "SaleReturnItem"("productId");

CREATE INDEX "CashRegisterSession_cashierId_idx" ON "CashRegisterSession"("cashierId");
CREATE INDEX "CashRegisterSession_status_idx" ON "CashRegisterSession"("status");
CREATE INDEX "CashRegisterSession_openedAt_idx" ON "CashRegisterSession"("openedAt");
CREATE INDEX "CashRegisterSession_closedAt_idx" ON "CashRegisterSession"("closedAt");
CREATE UNIQUE INDEX "CashRegisterSession_cashierId_open_unique" ON "CashRegisterSession"("cashierId") WHERE "status" = 'OPEN';

CREATE INDEX "CashMovement_sessionId_idx" ON "CashMovement"("sessionId");
CREATE INDEX "CashMovement_cashierId_idx" ON "CashMovement"("cashierId");
CREATE INDEX "CashMovement_saleId_idx" ON "CashMovement"("saleId");
CREATE INDEX "CashMovement_saleReturnId_idx" ON "CashMovement"("saleReturnId");
CREATE INDEX "CashMovement_type_idx" ON "CashMovement"("type");
CREATE INDEX "CashMovement_createdAt_idx" ON "CashMovement"("createdAt");

ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "SaleReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CashRegisterSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
