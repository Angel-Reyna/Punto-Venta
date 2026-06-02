import { CashRegisterStatus, InventoryType, SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { RECENT_SALES_LIMIT } from "./dashboard.shared";
import { INVENTORY_REASON_TYPES } from "../inventory/inventory.shared";

export type DashboardScopeWhere = {
  cashierId?: string;
};

export async function fetchDashboardSummaryData(input: {
  isAdmin: boolean;
  todayStart: Date;
  salesScopeWhere: DashboardScopeWhere;
  cashRegisterScopeWhere: DashboardScopeWhere;
}) {
  const {
    isAdmin,
    todayStart,
    salesScopeWhere,
    cashRegisterScopeWhere
  } = input;

  const [
    activeProducts,
    activeProductRows,
    groupedUsers,
    todaySalesAggregate,
    todayShrinkageAggregate,
    cashRegisterSessions,
    recentSales
  ] = await Promise.all([
    prisma.product.count({
      where: {
        isActive: true
      }
    }),

    prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        minStock: true
      },
      orderBy: [
        {
          name: "asc"
        },
        {
          sku: "asc"
        }
      ]
    }),

    isAdmin
      ? prisma.user.groupBy({
          by: ["role"],
          where: {
            isActive: true
          },
          _count: {
            _all: true
          },
          orderBy: {
            role: "asc"
          }
        })
      : Promise.resolve([]),

    prisma.sale.aggregate({
      where: {
        ...salesScopeWhere,
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: todayStart
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        total: true
      },
      _avg: {
        total: true
      }
    }),

    isAdmin
      ? prisma.inventoryMovement.aggregate({
          where: {
            type: InventoryType.OUT,
            reasonType: INVENTORY_REASON_TYPES.EXPIRATION,
            createdAt: {
              gte: todayStart
            }
          },
          _sum: {
            quantity: true,
            costAmount: true
          }
        })
      : Promise.resolve({
          _sum: {
            quantity: 0,
            costAmount: 0
          }
        }),

    prisma.cashRegisterSession.findMany({
      where: {
        ...cashRegisterScopeWhere,
        status: CashRegisterStatus.OPEN
      },
      select: {
        id: true,
        cashierId: true,
        openedAt: true,
        cashier: {
          select: {
            name: true
          }
        },
        movements: {
          select: {
            type: true,
            amount: true
          }
        }
      },
      orderBy: {
        openedAt: "desc"
      }
    }),

    prisma.sale.findMany({
      where: salesScopeWhere,
      select: {
        id: true,
        folio: true,
        status: true,
        total: true,
        createdAt: true,
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: RECENT_SALES_LIMIT
    })
  ]);

  return {
    activeProducts,
    activeProductRows,
    groupedUsers,
    todaySalesAggregate,
    todayShrinkageAggregate,
    cashRegisterSessions,
    recentSales
  };
}
