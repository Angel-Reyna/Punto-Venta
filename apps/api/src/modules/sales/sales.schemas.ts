import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const saleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional().nullable(),
    customerName: z.string().trim().max(120).optional().nullable(),
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

export type CreateSaleInput = z.infer<typeof saleSchema>["body"];
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>["body"];
export type ReturnSaleInput = z.infer<typeof returnSaleSchema>["body"];
