-- Preserve historical product identity before allowing physical product deletion.
-- Existing rows are backfilled from Product, then productId becomes nullable
-- and foreign keys are changed to ON DELETE SET NULL.

ALTER TABLE "SaleItem" ADD COLUMN "productSku" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN "productName" TEXT;

UPDATE "SaleItem" AS si
SET "productSku" = p."sku",
    "productName" = p."name"
FROM "Product" AS p
WHERE si."productId" = p."id";

ALTER TABLE "SaleItem" ALTER COLUMN "productSku" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "productName" SET NOT NULL;
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_productId_fkey";
ALTER TABLE "SaleItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "SaleItem"
  ADD CONSTRAINT "SaleItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaleReturnItem" ADD COLUMN "productSku" TEXT;
ALTER TABLE "SaleReturnItem" ADD COLUMN "productName" TEXT;

UPDATE "SaleReturnItem" AS sri
SET "productSku" = p."sku",
    "productName" = p."name"
FROM "Product" AS p
WHERE sri."productId" = p."id";

ALTER TABLE "SaleReturnItem" ALTER COLUMN "productSku" SET NOT NULL;
ALTER TABLE "SaleReturnItem" ALTER COLUMN "productName" SET NOT NULL;
ALTER TABLE "SaleReturnItem" DROP CONSTRAINT "SaleReturnItem_productId_fkey";
ALTER TABLE "SaleReturnItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "SaleReturnItem"
  ADD CONSTRAINT "SaleReturnItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement" ADD COLUMN "productSku" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "productName" TEXT;

UPDATE "InventoryMovement" AS im
SET "productSku" = p."sku",
    "productName" = p."name"
FROM "Product" AS p
WHERE im."productId" = p."id";

ALTER TABLE "InventoryMovement" ALTER COLUMN "productSku" SET NOT NULL;
ALTER TABLE "InventoryMovement" ALTER COLUMN "productName" SET NOT NULL;
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_productId_fkey";
ALTER TABLE "InventoryMovement" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
