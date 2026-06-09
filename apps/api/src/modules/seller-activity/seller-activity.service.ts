import { Prisma, Role, SellerAction } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";
import {
  redactSensitiveInputJson,
  redactSensitiveJsonValue
} from "../../utils/redaction";
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

export type SellerActivitySellerSummaryItem = {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  isActive: boolean;
  total: number;
  saleCreatedCount: number;
  failedAccessCount: number;
  lastActivityAt: string | null;
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
        metadata: redactSensitiveInputJson(input.metadata),
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
    logs: logs.map((log) => ({
      ...log,
      metadata: redactSensitiveJsonValue(log.metadata)
    }))
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


export async function getSellerActivitySellerSummary(
  query: SellerActivityQueryInput
): Promise<SellerActivitySellerSummaryItem[]> {
  const where = buildSellerActivityWhere(query);

  const [totals, actionCounts] = await Promise.all([
    prisma.sellerActivityLog.groupBy({
      by: ["sellerId"],
      where,
      _count: {
        _all: true
      },
      _max: {
        createdAt: true
      }
    }),
    prisma.sellerActivityLog.groupBy({
      by: ["sellerId", "action"],
      where,
      _count: {
        _all: true
      }
    })
  ]);

  const sellerIds = totals.map((item) => item.sellerId);

  if (sellerIds.length === 0) {
    return [];
  }

  const sellers = await prisma.user.findMany({
    where: {
      id: {
        in: sellerIds
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true
    }
  });

  const sellersById = new Map(sellers.map((seller) => [seller.id, seller]));
  const countsBySeller = new Map<
    string,
    { saleCreatedCount: number; failedAccessCount: number }
  >();

  for (const item of actionCounts) {
    const current = countsBySeller.get(item.sellerId) ?? {
      saleCreatedCount: 0,
      failedAccessCount: 0
    };

    if (item.action === SellerAction.SALE_CREATED) {
      current.saleCreatedCount = item._count._all;
    }

    if (item.action === SellerAction.FAILED_ACCESS_ATTEMPT) {
      current.failedAccessCount = item._count._all;
    }

    countsBySeller.set(item.sellerId, current);
  }

  return totals
    .map((item) => {
      const seller = sellersById.get(item.sellerId);
      const counts = countsBySeller.get(item.sellerId) ?? {
        saleCreatedCount: 0,
        failedAccessCount: 0
      };

      return {
        sellerId: item.sellerId,
        sellerName: seller?.name ?? "Vendedor eliminado",
        sellerEmail: seller?.email ?? "Sin correo disponible",
        isActive: seller?.isActive ?? false,
        total: item._count._all,
        saleCreatedCount: counts.saleCreatedCount,
        failedAccessCount: counts.failedAccessCount,
        lastActivityAt: item._max.createdAt?.toISOString() ?? null
      };
    })
    .sort((left, right) => {
      if (right.total !== left.total) return right.total - left.total;

      return (
        new Date(right.lastActivityAt ?? 0).getTime() -
        new Date(left.lastActivityAt ?? 0).getTime()
      );
    });
}
