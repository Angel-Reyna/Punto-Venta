-- Add compound indexes for the high-read operational screens.
-- These match common filters by owner/status/date and keep list/report queries index-friendly.

CREATE INDEX IF NOT EXISTS "Warehouse_type_isActive_idx" ON "Warehouse"("type", "isActive");

CREATE INDEX IF NOT EXISTS "InventoryBalance_warehouseId_quantity_idx" ON "InventoryBalance"("warehouseId", "quantity");

CREATE INDEX IF NOT EXISTS "InventoryMovement_type_createdAt_idx" ON "InventoryMovement"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_warehouseId_createdAt_idx" ON "InventoryMovement"("warehouseId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_createdBy_createdAt_idx" ON "InventoryMovement"("createdBy", "createdAt");

CREATE INDEX IF NOT EXISTS "Sale_status_createdAt_idx" ON "Sale"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Sale_cashierId_createdAt_idx" ON "Sale"("cashierId", "createdAt");
CREATE INDEX IF NOT EXISTS "Sale_cashierId_status_createdAt_idx" ON "Sale"("cashierId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Sale_warehouseId_createdAt_idx" ON "Sale"("warehouseId", "createdAt");

CREATE INDEX IF NOT EXISTS "SaleReturn_saleId_createdAt_idx" ON "SaleReturn"("saleId", "createdAt");
CREATE INDEX IF NOT EXISTS "SaleReturn_cashierId_createdAt_idx" ON "SaleReturn"("cashierId", "createdAt");
CREATE INDEX IF NOT EXISTS "SaleReturn_refundMethod_createdAt_idx" ON "SaleReturn"("refundMethod", "createdAt");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_tableName_createdAt_idx" ON "AuditLog"("tableName", "createdAt");
