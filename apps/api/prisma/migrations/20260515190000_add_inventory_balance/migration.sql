-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_productId_warehouseId_key" ON "InventoryBalance"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "InventoryBalance_warehouseId_idx" ON "InventoryBalance"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryBalance_quantity_idx" ON "InventoryBalance"("quantity");

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill balances from existing movements with an assigned warehouse.
INSERT INTO "InventoryBalance" (
    "id",
    "productId",
    "warehouseId",
    "quantity",
    "createdAt",
    "updatedAt"
)
SELECT
    md5("productId" || ':' || "warehouseId") AS "id",
    "productId",
    "warehouseId",
    CAST(
        SUM(
            CASE
                WHEN "type" IN ('IN', 'RETURN', 'ADJUSTMENT') THEN "quantity"
                WHEN "type" IN ('OUT', 'SALE') THEN -"quantity"
                ELSE 0
            END
        ) AS INTEGER
    ) AS "quantity",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "InventoryMovement"
WHERE "warehouseId" IS NOT NULL
GROUP BY "productId", "warehouseId"
HAVING SUM(
    CASE
        WHEN "type" IN ('IN', 'RETURN', 'ADJUSTMENT') THEN "quantity"
        WHEN "type" IN ('OUT', 'SALE') THEN -"quantity"
        ELSE 0
    END
) <> 0;
