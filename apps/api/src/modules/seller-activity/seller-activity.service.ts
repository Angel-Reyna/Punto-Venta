import { Prisma, Role, SellerAction } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";

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
