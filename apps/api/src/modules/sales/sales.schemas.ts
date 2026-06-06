import { PaymentMethod, SaleAdjustmentRequestStatus, SaleAdjustmentRequestType } from "@prisma/client";
import { z } from "zod";

export const saleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional().nullable(),
    customerName: z.string().trim().max(120).optional().nullable(),
    warehouseId: z.string().uuid().optional().nullable(),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
    paidAmount: z.coerce.number().min(0).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().positive().max(1_000_000)
        })
      )
      .min(1)
      .max(200)
  })
});

export const cancelSaleSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(5).max(500),
    refundMethod: z.nativeEnum(PaymentMethod).optional()
  })
});

export const returnSaleSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(5).max(500),
    refundMethod: z.nativeEnum(PaymentMethod).optional(),
    items: z
      .array(
        z.object({
          saleItemId: z.string().uuid(),
          quantity: z.coerce.number().int().positive().max(1_000_000)
        })
      )
      .min(1)
      .max(200)
  })
});

const adjustmentRequestItemSchema = z.object({
  saleItemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(1_000_000)
});

export const createSalesAdjustmentRequestSchema = z.object({
  body: z
    .object({
      type: z.nativeEnum(SaleAdjustmentRequestType),
      reason: z.string().trim().min(5).max(500),
      refundMethod: z.nativeEnum(PaymentMethod).optional(),
      items: z.array(adjustmentRequestItemSchema).max(200).optional()
    })
    .superRefine((value, ctx) => {
      if (value.type === SaleAdjustmentRequestType.RETURN_ITEMS) {
        if (!value.items || value.items.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items"],
            message: "Debes seleccionar al menos un producto para solicitar una devolución"
          });
        }
        return;
      }

      if (value.items && value.items.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "La cancelación de venta no debe incluir partidas específicas"
        });
      }
    })
});

export const listSalesAdjustmentRequestsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(SaleAdjustmentRequestStatus).optional(),
    type: z.nativeEnum(SaleAdjustmentRequestType).optional(),
    saleId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional()
  })
});

export const salesAdjustmentRequestIdParamsSchema = z.object({
  params: z.object({
    requestId: z.string().uuid()
  })
});

export const reviewSalesAdjustmentRequestSchema = z.object({
  body: z.object({
    reviewNote: z.string().trim().max(500).optional()
  })
});


export type CreateSaleInput = z.infer<typeof saleSchema>["body"];
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>["body"];
export type ReturnSaleInput = z.infer<typeof returnSaleSchema>["body"];
export type CreateSalesAdjustmentRequestInput = z.infer<typeof createSalesAdjustmentRequestSchema>["body"];
export type ListSalesAdjustmentRequestsQuery = z.infer<typeof listSalesAdjustmentRequestsSchema>["query"];
export type ReviewSalesAdjustmentRequestInput = z.infer<typeof reviewSalesAdjustmentRequestSchema>["body"];
