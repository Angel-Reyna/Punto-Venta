import type { Prisma } from "@prisma/client";

import {
  getDateRange,
  getOptionalString
} from "../../utils/pagination";

export type AuditLogQueryInput = {
  q?: string;
  action?: string;
  tableName?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export function parseAuditLogQuery(
  query: Record<string, unknown>
): AuditLogQueryInput {
  const q = getOptionalString(query.q, 120);
  const action = getOptionalString(query.action, 80);
  const tableName = getOptionalString(query.tableName, 80);
  const userId = getOptionalString(query.userId, 80);
  const { dateFrom, dateTo } = getDateRange(query);

  return {
    q,
    action,
    tableName,
    userId,
    dateFrom,
    dateTo
  };
}

export function buildAuditLogWhere(
  query: AuditLogQueryInput
): Prisma.AuditLogWhereInput {
  const { q, action, tableName, userId, dateFrom, dateTo } = query;

  return {
    ...(action
      ? {
          action: {
            contains: action,
            mode: "insensitive"
          }
        }
      : {}),
    ...(tableName
      ? {
          tableName: {
            contains: tableName,
            mode: "insensitive"
          }
        }
      : {}),
    ...(userId ? { userId } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {})
          }
        }
      : {}),
    ...(q
      ? {
          OR: [
            {
              action: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              tableName: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              recordId: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              user: {
                email: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            },
            {
              user: {
                name: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            }
          ]
        }
      : {})
  };
}
