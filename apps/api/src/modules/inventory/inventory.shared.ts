import { InventoryTransferRequestStatus, type InventoryType } from "@prisma/client";
import { z } from "zod";

export const DEFAULT_WAREHOUSE_NAME = "Principal";
export const INVENTORY_REASON_TYPES = {
  EXPIRATION: "EXPIRATION",
  DAMAGE: "DAMAGE",
  OTHER: "OTHER"
} as const;

export type InventoryReasonType =
  (typeof INVENTORY_REASON_TYPES)[keyof typeof INVENTORY_REASON_TYPES];

export const EXPIRATION_REASON_LABEL = "Caducidad";
export const DAMAGE_REASON_LABEL = "Daños";

export const SHRINKAGE_REASON_TYPES = [
  INVENTORY_REASON_TYPES.EXPIRATION,
  INVENTORY_REASON_TYPES.DAMAGE
] as const;

export type InventoryShrinkageReasonType = (typeof SHRINKAGE_REASON_TYPES)[number];

export function isShrinkageReasonType(
  reasonType: string | null | undefined
): reasonType is InventoryShrinkageReasonType {
  return SHRINKAGE_REASON_TYPES.includes(reasonType as InventoryShrinkageReasonType);
}

export type WarehouseInput = {
  name: string;
  description?: string | null;
};

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

export type InventoryTransferRequestItemInput = {
  productId: string;
  quantity: number;
};

export type InventoryTransferRequestInput = {
  fromWarehouseId?: string | null;
  reason: string;
  items: InventoryTransferRequestItemInput[];
};

export const inventoryReasonTypes = Object.values(INVENTORY_REASON_TYPES) as [
  InventoryReasonType,
  ...InventoryReasonType[]
];

export const warehouseSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre del almacén debe tener al menos 2 caracteres.")
      .max(80, "El nombre del almacén no puede superar 80 caracteres."),

    description: z
      .string()
      .trim()
      .max(255, "La descripción no puede superar 255 caracteres.")
      .optional()
      .nullable()
  })
});

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

export const sellerStockWarehouseParamsSchema = z.object({
  params: z.object({
    sellerId: z.string().uuid()
  })
});


export const inventoryTransferRequestStatusSchema = z.nativeEnum(
  InventoryTransferRequestStatus
);

export const inventoryTransferRequestSchema = z.object({
  body: z.object({
    fromWarehouseId: z
      .string()
      .uuid()
      .optional()
      .nullable(),

    reason: z
      .string()
      .trim()
      .min(3, "Describe el motivo de la solicitud.")
      .max(255, "El motivo no puede superar 255 caracteres."),

    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce
            .number()
            .int()
            .positive()
            .max(1_000_000)
        })
      )
      .min(1, "Agrega al menos un producto a la solicitud.")
      .max(100, "No puedes solicitar más de 100 productos a la vez.")
  })
});


export const inventoryTransferRequestApprovalSchema = z.object({
  params: z.object({
    requestId: z.string().uuid()
  }),
  body: z.object({
    reviewNote: z
      .string()
      .trim()
      .max(255, "La nota de revisión no puede superar 255 caracteres.")
      .optional()
      .nullable()
  })
});

export const inventoryTransferRequestReviewSchema = z.object({
  params: z.object({
    requestId: z.string().uuid()
  }),
  body: z.object({
    reviewNote: z
      .string()
      .trim()
      .min(3, "Agrega una nota de revisión.")
      .max(255, "La nota de revisión no puede superar 255 caracteres.")
  })
});

export const inventoryTransferRequestParamsSchema = z.object({
  params: z.object({
    requestId: z.string().uuid()
  })
});
