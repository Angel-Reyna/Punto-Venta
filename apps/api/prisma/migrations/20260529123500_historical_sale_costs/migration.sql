-- Store immutable sale economics so reports can calculate historical profit
-- even when product cost, sale price, promotion or product existence changes later.
ALTER TABLE "SaleItem"
  ADD COLUMN "unitCost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "promoPercent" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "grossProfit" DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE "SaleReturnItem"
  ADD COLUMN "unitCost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "promoPercent" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "grossProfit" DECIMAL(12, 2) NOT NULL DEFAULT 0;
