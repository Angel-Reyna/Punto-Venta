import { prisma } from "../../config/prisma";
import type { Prisma } from "@prisma/client";

export async function auditLog(args: {
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId: args.userId,
      action: args.action,
      tableName: args.tableName,
      recordId: args.recordId,
      oldData: args.oldData,
      newData: args.newData,
      ipAddress: args.ipAddress
    }
  });
}
