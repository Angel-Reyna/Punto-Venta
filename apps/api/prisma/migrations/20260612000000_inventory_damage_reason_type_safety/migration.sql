-- Safety migration for local databases where the previous DAMAGE enum migration
-- was marked as applied but the PostgreSQL enum value was not actually present.
ALTER TYPE "InventoryReasonType" ADD VALUE IF NOT EXISTS 'DAMAGE';
