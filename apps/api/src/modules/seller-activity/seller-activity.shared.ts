import { Prisma, SellerAction } from "@prisma/client";
import { z } from "zod";

import { AppError } from "../../utils/AppError";

export const sellerActivityQuerySchema = z.object({
  sellerId: z.string().uuid().optional(),
  action: z.nativeEnum(SellerAction).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export type SellerActivityQueryInput = z.infer<typeof sellerActivityQuerySchema>;

export type SellerActivityDateFilter = {
  gte?: Date;
  lte?: Date;
};

export function parseSellerActivityDateFilter(
  from?: string,
  to?: string
): SellerActivityDateFilter | undefined {
  if (!from && !to) {
    return undefined;
  }

  const createdAt: SellerActivityDateFilter = {};

  if (from) {
    const start = new Date(from);

    if (Number.isNaN(start.getTime())) {
      throw new AppError(400, "Fecha inicial inválida");
    }

    start.setHours(0, 0, 0, 0);
    createdAt.gte = start;
  }

  if (to) {
    const end = new Date(to);

    if (Number.isNaN(end.getTime())) {
      throw new AppError(400, "Fecha final inválida");
    }

    end.setHours(23, 59, 59, 999);
    createdAt.lte = end;
  }

  if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
    throw new AppError(
      400,
      "La fecha inicial no puede ser mayor que la fecha final"
    );
  }

  return createdAt;
}

export function buildSellerActivityWhere(
  query: SellerActivityQueryInput
): Prisma.SellerActivityLogWhereInput {
  const createdAt = parseSellerActivityDateFilter(query.from, query.to);

  return {
    ...(query.sellerId
      ? {
          sellerId: query.sellerId
        }
      : {}),
    ...(query.action
      ? {
          action: query.action
        }
      : {}),
    ...(createdAt
      ? {
          createdAt
        }
      : {})
  };
}
