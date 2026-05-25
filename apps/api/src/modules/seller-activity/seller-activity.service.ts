import { Prisma, Role, SellerAction } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import type { Pagination } from "../../utils/pagination";
import {
  buildSellerActivityWhere,
  type SellerActivityQueryInput
} from "./seller-activity.shared";

export type SellerActivityClientMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type SellerActivityInput = SellerActivityClientMeta & {
  sellerId: string;
  action: SellerAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

export const sellerActivityLogInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  }
} satisfies Prisma.SellerActivityLogInclude;

export type SellerActivityLogWithSeller = Prisma.SellerActivityLogGetPayload<{
  include: typeof sellerActivityLogInclude;
}>;

export type SellerActivitySummaryItem = {
  action: SellerAction;
  count: number;
};

export async function logSellerActivity(input: SellerActivityInput) {
  try {
    await prisma.sellerActivityLog.create({
      data: {
        sellerId: input.sellerId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        description: input.description,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      }
    });
  } catch (error) {
    logger.warn("Seller activity log write failed", {
      error,
      sellerId: input.sellerId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId
    });
  }
}

export function shouldLogSellerActivity(user?: { role: Role }) {
  return user?.role === Role.CASHIER;
}

export async function listSellerActivity(
  query: SellerActivityQueryInput,
  pagination: Pick<Pagination, "skip" | "take">
): Promise<{
  total: number;
  logs: SellerActivityLogWithSeller[];
}> {
  const where = buildSellerActivityWhere(query);

  const [total, logs] = await Promise.all([
    prisma.sellerActivityLog.count({ where }),
    prisma.sellerActivityLog.findMany({
      where,
      include: sellerActivityLogInclude,
      orderBy: {
        createdAt: "desc"
      },
      skip: pagination.skip,
      take: pagination.take
    })
  ]);

  return {
    total,
    logs
  };
}

export async function getSellerActivitySummary(
  query: SellerActivityQueryInput
): Promise<SellerActivitySummaryItem[]> {
  const where = buildSellerActivityWhere(query);

  const logs = await prisma.sellerActivityLog.groupBy({
    by: ["action"],
    where,
    _count: {
      action: true
    }
  });

  return logs.map((item) => ({
    action: item.action,
    count: item._count.action
  }));
}
