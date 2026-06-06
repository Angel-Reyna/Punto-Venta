-- Add sale source warehouse without changing historical rows.
ALTER TABLE "Sale" ADD COLUMN "warehouseId" TEXT;

CREATE INDEX "Sale_warehouseId_idx" ON "Sale"("warehouseId");

ALTER TABLE "Sale"
  ADD CONSTRAINT "Sale_warehouseId_fkey"
  FOREIGN KEY ("warehouseId")
  REFERENCES "Warehouse"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
