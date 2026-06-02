const prismaMock = {
  product: {
    count: jest.fn(),
    findMany: jest.fn()
  },
  user: {
    groupBy: jest.fn()
  },
  sale: {
    aggregate: jest.fn(),
    findMany: jest.fn()
  },
  cashRegisterSession: {
    findMany: jest.fn()
  },
  inventoryMovement: {
    aggregate: jest.fn()
  }
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

const inventoryServiceMock = {
  getProductStocks: jest.fn()
};

jest.mock("../src/modules/inventory/inventory.service", () => inventoryServiceMock);

import { CashMovementType, Role, SaleStatus } from "@prisma/client";

import { getDashboardSummary } from "../src/modules/dashboard/dashboard.service";

describe("dashboard.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prismaMock.product.count.mockResolvedValue(3);
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        sku: "CAF-001",
        name: "Café",
        minStock: 5
      },
      {
        id: "product-2",
        sku: "PAN-001",
        name: "Pan",
        minStock: 10
      },
      {
        id: "product-3",
        sku: "LEC-001",
        name: "Leche",
        minStock: 2
      }
    ]);
    inventoryServiceMock.getProductStocks.mockResolvedValue(
      new Map<string, number>([
        ["product-1", 0],
        ["product-2", 7],
        ["product-3", 5]
      ])
    );
    prismaMock.sale.aggregate.mockResolvedValue({
      _count: {
        _all: 2
      },
      _sum: {
        total: 300
      },
      _avg: {
        total: 150
      }
    });
    prismaMock.inventoryMovement.aggregate.mockResolvedValue({
      _sum: {
        quantity: 4,
        costAmount: 72
      }
    });
    prismaMock.sale.findMany.mockResolvedValue([
      {
        id: "sale-1",
        folio: "SALE-1",
        status: SaleStatus.COMPLETED,
        total: 200,
        createdAt: new Date("2026-05-20T10:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Caja 1",
          email: "cashier@pos.local"
        }
      }
    ]);
    prismaMock.cashRegisterSession.findMany.mockResolvedValue([
      {
        id: "session-1",
        cashierId: "cashier-1",
        openedAt: new Date("2026-05-20T09:00:00.000Z"),
        cashier: {
          name: "Caja 1"
        },
        movements: [
          {
            type: CashMovementType.OPENING,
            amount: 100
          },
          {
            type: CashMovementType.SALE_CASH,
            amount: 250
          },
          {
            type: CashMovementType.CASH_OUT,
            amount: 50
          }
        ]
      }
    ]);
  });

  it("returns actionable admin metrics with role-separated users and stock severity", async () => {
    prismaMock.user.groupBy.mockResolvedValue([
      {
        role: Role.ADMIN,
        _count: {
          _all: 1
        }
      },
      {
        role: Role.CASHIER,
        _count: {
          _all: 2
        }
      }
    ]);

    const summary = await getDashboardSummary({
      id: "admin-1",
      email: "admin@pos.local",
      role: Role.ADMIN
    });

    expect(prismaMock.user.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["role"],
        where: {
          isActive: true
        }
      })
    );
    expect(prismaMock.sale.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: SaleStatus.COMPLETED
        })
      })
    );
    expect(prismaMock.inventoryMovement.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "OUT",
          reasonType: "EXPIRATION"
        }),
        _sum: {
          quantity: true,
          costAmount: true
        }
      })
    );
    expect(summary.productSummary.shrinkageUnitsToday).toBe(4);
    expect(summary.productSummary.shrinkageCostToday).toBe(72);
    expect(prismaMock.cashRegisterSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "OPEN"
        }
      })
    );
    expect(summary.role).toBe(Role.ADMIN);
    expect(summary.userSummary).toEqual({
      totalActive: 3,
      activeAdmins: 1,
      activeCashiers: 2
    });
    expect(summary.productSummary.lowStockTotal).toBe(2);
    expect(summary.productSummary.outOfStockTotal).toBe(1);
    expect(summary.productSummary.lowStockItems).toEqual([
      expect.objectContaining({
        id: "product-1",
        currentStock: 0,
        severity: "critical"
      }),
      expect.objectContaining({
        id: "product-2",
        currentStock: 7,
        severity: "warning"
      })
    ]);
    expect(summary.salesToday).toEqual({
      scope: "global",
      count: 2,
      total: 300,
      averageTicket: 150
    });
    expect(summary.cashRegister).toEqual(
      expect.objectContaining({
        scope: "global",
        hasOpenRegister: true,
        openSessions: 1,
        currentBalance: 300
      })
    );
    expect(summary.recentSales).toEqual([
      expect.objectContaining({
        id: "sale-1",
        total: 200
      })
    ]);

    // Backward-compatible aliases for the current frontend dashboard.
    expect(summary.products).toBe(3);
    expect(summary.lowStock).toBe(2);
    expect(summary.users).toBe(3);
    expect(summary.todaySalesCount).toBe(2);
    expect(summary.todaySalesTotal).toBe(300);
  });

  it("limits cashier dashboard scope to own sales and own cash register without exposing users", async () => {
    const summary = await getDashboardSummary({
      id: "cashier-1",
      email: "cashier@pos.local",
      role: Role.CASHIER
    });

    expect(prismaMock.user.groupBy).not.toHaveBeenCalled();
    expect(prismaMock.inventoryMovement.aggregate).not.toHaveBeenCalled();
    expect(prismaMock.sale.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cashierId: "cashier-1",
          status: SaleStatus.COMPLETED
        })
      })
    );
    expect(prismaMock.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cashierId: "cashier-1"
        }
      })
    );
    expect(summary.productSummary.shrinkageUnitsToday).toBe(0);
    expect(summary.productSummary.shrinkageCostToday).toBe(0);
    expect(prismaMock.cashRegisterSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cashierId: "cashier-1",
          status: "OPEN"
        }
      })
    );
    expect(summary.userSummary).toEqual({
      totalActive: 0,
      activeAdmins: 0,
      activeCashiers: 0
    });
    expect(summary.salesToday.scope).toBe("cashier");
    expect(summary.cashRegister.scope).toBe("cashier");
    expect(summary.users).toBe(0);
  });
});
