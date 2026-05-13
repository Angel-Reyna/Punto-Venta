import { prisma } from "../../config/prisma";

type AuditLogInput = {
  userId?: string;

  action: string;

  tableName: string;

  recordId?: string;

  oldData?: unknown;

  newData?: unknown;

  ipAddress?: string;
};

export async function auditLog({
  userId,
  action,
  tableName,
  recordId,
  oldData,
  newData,
  ipAddress
}: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,

        action,

        tableName,

        recordId,

        oldData:
          oldData === undefined
            ? undefined
            : JSON.parse(
                JSON.stringify(oldData)
              ),

        newData:
          newData === undefined
            ? undefined
            : JSON.parse(
                JSON.stringify(newData)
              ),

        ipAddress
      }
    });
  } catch (error) {
    console.error(
      "AUDIT_LOG_ERROR",
      error
    );
  }
}