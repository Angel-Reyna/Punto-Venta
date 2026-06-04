const prismaMock = {
  sale: {
    findMany: jest.fn()
  },
  saleReturn: {
    findMany: jest.fn()
  },
  saleItem: {
    groupBy: jest.fn(),
    findMany: jest.fn()
  },
  saleReturnItem: {
    groupBy: jest.fn(),
    findMany: jest.fn()
  },
  inventoryMovement: {
    findMany: jest.fn()
  },
  product: {
    findMany: jest.fn()
  }
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

jest.mock("@prisma/client", () => ({
  SaleStatus: {
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
    REFUNDED: "REFUNDED"
  },
  PaymentMethod: {
    CASH: "CASH",
    CARD: "CARD",
    TRANSFER: "TRANSFER",
    MIXED: "MIXED"
  }
}));

import { PaymentMethod, SaleStatus } from "@prisma/client";

import {
  getOperationsReport,
  parseReportDateRange
} from "../src/modules/reports/reports.service";

describe("reports.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates date ranges strictly", () => {
    expect(() => parseReportDateRange(undefined, "2026-05-20")).toThrow(
      "Debes enviar fecha inicial y fecha final"
    );
    expect(() => parseReportDateRange("2026-02-31", "2026-05-20")).toThrow(
      "La fecha inicial no es una fecha válida"
    );
    expect(() => parseReportDateRange("2026-05-21", "2026-05-20")).toThrow(
      "La fecha inicial no puede ser mayor que la fecha final"
    );
    expect(() => parseReportDateRange("2025-01-01", "2026-05-20")).toThrow(
      "El rango máximo permitido para reportes es de 366 días"
    );
  });

  it("builds a consistent operations report with refunds and net top products", async () => {
    const range = parseReportDateRange("2026-05-20", "2026-05-20");

    prismaMock.sale.findMany.mockResolvedValue([
      {
        id: "sale-1",
        folio: "SALE-1",
        status: SaleStatus.COMPLETED,
        total: 200,
        createdAt: new Date("2026-05-20T10:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Vendedor 1",
          email: "vendedor@punta-venta.local"
        },
        payments: [
          {
            id: "payment-1",
            method: PaymentMethod.CASH,
            amount: 200
          }
        ],
        items: [
          {
            id: "item-1",
            quantity: 5,
            unitCost: 20,
            grossProfit: 100
          }
        ]
      },
      {
        id: "sale-2",
        folio: "SALE-2",
        status: SaleStatus.CANCELLED,
        total: 999,
        createdAt: new Date("2026-05-20T11:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Vendedor 1",
          email: "vendedor@punta-venta.local"
        },
        payments: [
          {
            id: "payment-2",
            method: PaymentMethod.CASH,
            amount: 999
          }
        ],
        items: [
          {
            id: "item-ignored",
            quantity: 1,
            unitCost: 1,
            grossProfit: 998
          }
        ]
      }
    ]);
    prismaMock.saleReturn.findMany.mockResolvedValue([
      {
        id: "return-1",
        saleId: "sale-1",
        cashierId: "admin-1",
        reason: "Producto regresado",
        refundMethod: PaymentMethod.CASH,
        refundTotal: 50,
        createdAt: new Date("2026-05-20T12:00:00.000Z"),
        updatedAt: new Date("2026-05-20T12:00:00.000Z"),
        cashier: {
          id: "admin-1",
          name: "Admin",
          email: "admin@pos.local"
        },
        sale: {
          cashierId: "cashier-1",
          cashier: {
            id: "cashier-1",
            name: "Vendedor 1",
            email: "vendedor@punta-venta.local"
          }
        },
        items: [
          {
            id: "return-item-1",
            quantity: 1,
            unitCost: 20,
            grossProfit: 30
          }
        ]
      }
    ]);
    prismaMock.saleItem.findMany.mockResolvedValue([
      {
        productId: "product-1",
        productSku: "CAF-001",
        productName: "Café",
        quantity: 5,
        total: 200,
        unitCost: 20,
        grossProfit: 100
      }
    ]);
    prismaMock.saleReturnItem.findMany.mockResolvedValue([
      {
        productId: "product-1",
        productSku: "CAF-001",
        productName: "Café",
        quantity: 1,
        total: 50,
        unitCost: 20,
        grossProfit: 30
      }
    ]);
    prismaMock.inventoryMovement.findMany.mockResolvedValue([
      {
        id: "inventory-1",
        productId: "product-1",
        productSku: "CAF-001",
        productName: "Café",
        warehouseId: "warehouse-1",
        type: "OUT",
        quantity: 2,
        reason: "Caducidad",
        reasonType: "EXPIRATION",
        unitCostAtMovement: 20,
        costAmount: 40,
        createdBy: "admin-1",
        createdAt: new Date("2026-05-20T09:00:00.000Z"),
        warehouse: {
          id: "warehouse-1",
          name: "Principal"
        }
      },
      {
        id: "inventory-2",
        productId: "product-1",
        productSku: "CAF-001",
        productName: "Café",
        warehouseId: "warehouse-1",
        type: "IN",
        quantity: 7,
        reason: "Reposición",
        reasonType: "OTHER",
        unitCostAtMovement: 20,
        costAmount: 140,
        createdBy: "admin-1",
        createdAt: new Date("2026-05-20T08:00:00.000Z"),
        warehouse: {
          id: "warehouse-1",
          name: "Principal"
        }
      }
    ]);
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        sku: "CAF-001",
        name: "Café"
      }
    ]);

    const report = await getOperationsReport(range);

    expect(prismaMock.saleItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sale: expect.objectContaining({
            status: {
              not: SaleStatus.CANCELLED
            }
          })
        })
      })
    );
    expect(report.sales.byStatus).toEqual({
      COMPLETED: 1,
      CANCELLED: 1
    });
    expect(report.sales.gross).toBe(200);
    expect(report.sales.refunded).toBe(50);
    expect(report.sales.net).toBe(150);
    expect(report.sales.profit).toEqual({
      grossCost: 100,
      returnedCost: 20,
      netCost: 80,
      grossProfit: 100,
      returnedProfit: 30,
      netProfit: 70,
      marginPercent: 46.67
    });
    expect(report.sales.paymentSummary).toEqual({
      CASH: 200
    });
    expect(prismaMock.saleReturn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          sale: expect.objectContaining({
            select: expect.objectContaining({
              cashier: expect.any(Object)
            })
          })
        })
      })
    );
    expect(report.returns.byMethod).toEqual({
      CASH: 50
    });
    expect(report.sales.bySeller).toEqual([
      {
        seller: {
          id: "cashier-1",
          name: "Vendedor 1",
          email: "vendedor@punta-venta.local"
        },
        count: 1,
        gross: 200,
        refunded: 50,
        net: 150
      }
    ]);
    expect(report.returns.latest[0]).toEqual(
      expect.objectContaining({
        cashierId: "cashier-1",
        cashier: {
          id: "cashier-1",
          name: "Vendedor 1",
          email: "vendedor@punta-venta.local"
        }
      })
    );
    expect(report.topProducts).toEqual([
      {
        product: {
          id: "product-1",
          sku: "CAF-001",
          name: "Café"
        },
        quantity: 4,
        total: 150,
        cost: 80,
        grossProfit: 70
      }
    ]);
    expect(report.sales.activeCount).toBe(1);
    expect(report.sales.unitsSold).toBe(5);
    expect(report.sales.unitsReturned).toBe(1);
    expect(report.sales.unitsNet).toBe(4);
    expect(report.sales.unitsPerTransaction).toBe(4);
    expect(report.sales.daily).toEqual([
      {
        date: "2026-05-20",
        count: 1,
        gross: 200,
        refunded: 50,
        net: 150,
        units: 4
      }
    ]);
    expect(report.inventory.movements.unitsIn).toBe(7);
    expect(report.inventory.movements.unitsOut).toBe(2);
    expect(report.inventory.shrinkage.totalUnits).toBe(2);
    expect(report.inventory.shrinkage.totalCost).toBe(40);
    expect(report.inventory.shrinkage.byProduct).toEqual([
      {
        product: {
          id: "product-1",
          sku: "CAF-001",
          name: "Café"
        },
        quantity: 2,
        cost: 40
      }
    ]);
    expect(report.sales.recent).toEqual([
      expect.objectContaining({
        id: "sale-1",
        total: 200
      }),
      expect.objectContaining({
        id: "sale-2",
        total: 999
      })
    ]);
  });

  it("uses historical snapshots for physically deleted products in top products", async () => {
    const range = parseReportDateRange("2026-05-20", "2026-05-20");

    prismaMock.sale.findMany.mockResolvedValue([]);
    prismaMock.saleReturn.findMany.mockResolvedValue([]);
    prismaMock.saleItem.findMany.mockResolvedValue([
      {
        productId: null,
        productSku: "DEL-001",
        productName: "Producto eliminado",
        quantity: 2,
        total: 120,
        unitCost: 30,
        grossProfit: 60
      }
    ]);
    prismaMock.saleReturnItem.findMany.mockResolvedValue([
      {
        productId: null,
        productSku: "DEL-001",
        productName: "Producto eliminado",
        quantity: 1,
        total: 60,
        unitCost: 30,
        grossProfit: 30
      }
    ]);
    prismaMock.inventoryMovement.findMany.mockResolvedValue([]);

    const report = await getOperationsReport(range);

    expect(report.topProducts).toEqual([
      {
        product: {
          id: "deleted:DEL-001:Producto eliminado",
          sku: "DEL-001",
          name: "Producto eliminado (eliminado)"
        },
        quantity: 1,
        total: 60,
        cost: 30,
        grossProfit: 30
      }
    ]);
  });

});
