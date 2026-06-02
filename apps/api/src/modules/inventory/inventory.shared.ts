import type { InventoryType } from "@prisma/client";
import { z } from "zod";

export const DEFAULT_WAREHOUSE_NAME = "Principal";
export const INVENTORY_REASON_TYPES = {
  EXPIRATION: "EXPIRATION",
  OTHER: "OTHER"
} as const;

export type InventoryReasonType =
  (typeof INVENTORY_REASON_TYPES)[keyof typeof INVENTORY_REASON_TYPES];

export const EXPIRATION_REASON_LABEL = "Caducidad";

export type StockMovementInput = {
  productId: string;
  warehouseId?: string | null;
  quantity: number;
  reason?: string | null;
  reasonType?: InventoryReasonType;
  createdBy: string;
  type: InventoryType;
  insufficientStockMessage?: string;
};

export const inventoryReasonTypes = Object.values(INVENTORY_REASON_TYPES) as [
  InventoryReasonType,
  ...InventoryReasonType[]
];

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

    reasonType: z
      .enum(inventoryReasonTypes)
      .optional()
      .default("OTHER"),

    reason: z
      .string()
      .trim()
      .min(3)
      .max(255)
      .optional()
      .nullable()
  })
  .superRefine((body, context) => {
    if (body.reasonType === "OTHER" && !body.reason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Describe el motivo del movimiento.",
        path: ["reason"]
      });
    }
  })
});
