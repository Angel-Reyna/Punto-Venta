import { prisma } from "../../config/prisma";
import {
  redactSensitiveInputJson,
  redactSensitiveJsonValue
} from "../../utils/redaction";
import type { Prisma } from "@prisma/client";
import type { Pagination } from "../../utils/pagination";
import {
  buildAuditLogWhere,
  type AuditLogQueryInput
} from "./audit.shared";

export const auditLogUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }
} satisfies Prisma.AuditLogInclude;

export type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: typeof auditLogUserInclude;
}>;

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
      oldData: redactSensitiveInputJson(args.oldData),
      newData: redactSensitiveInputJson(args.newData),
      ipAddress: args.ipAddress
    }
  });
}

export async function listAuditLogs(
  query: AuditLogQueryInput,
  pagination: Pick<Pagination, "skip" | "take">
): Promise<{
  total: number;
  logs: AuditLogWithUser[];
}> {
  const where = buildAuditLogWhere(query);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: auditLogUserInclude,
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
      oldData: redactSensitiveJsonValue(log.oldData),
      newData: redactSensitiveJsonValue(log.newData)
    }))
  };
}
