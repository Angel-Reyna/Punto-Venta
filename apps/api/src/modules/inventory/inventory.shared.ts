import type { InventoryType } from "@prisma/client";
import { z } from "zod";

export const DEFAULT_WAREHOUSE_NAME = "Principal";

export type StockMovementInput = {
  productId: string;
  warehouseId?: string | null;
  quantity: number;
  reason?: string | null;
  createdBy: string;
  type: InventoryType;
  insufficientStockMessage?: string;
};

export const movementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),

    warehouseId: z
      .string()
      .uuid()
      .optional()
      .nullable(),

    quantity: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000),

    reason: z
      .string()
      .trim()
      .min(3)
      .max(255)
  })
});
