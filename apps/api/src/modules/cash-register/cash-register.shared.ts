import { CashMovementType, Role } from "@prisma/client";
import { z } from "zod";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const moneySchema = z.coerce
  .number()
  .finite()
  .min(0)
  .max(99_999_999)
  .transform((value) => roundMoney(value));

export const openCashRegisterSchema = z.object({
  body: z.object({
    openingAmount: moneySchema,
    notes: z.string().trim().max(500).optional().nullable()
  })
});

export const closeCashRegisterSchema = z.object({
  body: z.object({
    closingAmount: moneySchema,
    notes: z.string().trim().max(500).optional().nullable()
  })
});

export const manualCashMovementSchema = z.object({
  body: z.object({
    type: z.enum([CashMovementType.CASH_IN, CashMovementType.CASH_OUT]),
    amount: moneySchema.refine((value) => value > 0, {
      message: "El monto debe ser mayor a cero"
    }),
    reason: z.string().trim().min(3).max(255)
  })
});

export type OpenCashRegisterInput = z.infer<
  typeof openCashRegisterSchema
>["body"];
export type CloseCashRegisterInput = z.infer<
  typeof closeCashRegisterSchema
>["body"];
export type ManualCashMovementInput = z.infer<
  typeof manualCashMovementSchema
>["body"];

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};
