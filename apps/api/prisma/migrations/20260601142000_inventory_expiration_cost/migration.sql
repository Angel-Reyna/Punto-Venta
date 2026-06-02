-- Store structured inventory movement reasons and the product cost captured when a movement is recorded.
-- This lets dashboard/reporting quantify caducidad as money lost, not only units removed.
-- IF NOT EXISTS keeps local recovery safe if a previous deploy attempt failed after partial DDL.
DO $$
BEGIN
  CREATE TYPE "InventoryReasonType" AS ENUM ('EXPIRATION', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "InventoryMovement"
ADD COLUMN IF NOT EXISTS "reasonType" "InventoryReasonType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN IF NOT EXISTS "unitCostAtMovement" DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS "costAmount" DECIMAL(12, 2);

CREATE INDEX IF NOT EXISTS "InventoryMovement_reasonType_idx" ON "InventoryMovement"("reasonType");
CREATE INDEX IF NOT EXISTS "InventoryMovement_reasonType_createdAt_idx" ON "InventoryMovement"("reasonType", "createdAt");
