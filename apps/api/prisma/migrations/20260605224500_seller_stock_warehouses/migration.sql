-- Modela stock físico asignado a vendedores reutilizando almacenes como ubicaciones de inventario.
-- Los almacenes existentes permanecen como STORAGE; cada vendedor puede tener un almacén SELLER asociado.
CREATE TYPE "WarehouseType" AS ENUM ('STORAGE', 'SELLER');

ALTER TABLE "Warehouse"
  ADD COLUMN "type" "WarehouseType" NOT NULL DEFAULT 'STORAGE',
  ADD COLUMN "sellerId" TEXT;

CREATE UNIQUE INDEX "Warehouse_sellerId_key" ON "Warehouse"("sellerId");
CREATE INDEX "Warehouse_type_idx" ON "Warehouse"("type");

ALTER TABLE "Warehouse"
  ADD CONSTRAINT "Warehouse_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
