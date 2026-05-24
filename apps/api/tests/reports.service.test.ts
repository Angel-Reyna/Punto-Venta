const prismaMock = {
  sale: {
    findMany: jest.fn()
  },
  saleReturn: {
    findMany: jest.fn()
  },
  cashRegisterSession: {
    findMany: jest.fn()
  },
  cashMovement: {
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
  },
  CashMovementType: {
    OPENING: "OPENING",
    CASH_IN: "CASH_IN",
    CASH_OUT: "CASH_OUT",
    SALE_CASH: "SALE_CASH",
    RETURN_CASH: "RETURN_CASH"
  }
}));

import { CashMovementType, PaymentMethod, SaleStatus } from "@prisma/client";

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
          name: "Caja 1",
          email: "cashier@pos.local"
        },
        payments: [
          {
            id: "payment-1",
            method: PaymentMethod.CASH,
            amount: 200
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
          name: "Caja 1",
          email: "cashier@pos.local"
        },
        payments: [
          {
            id: "payment-2",
            method: PaymentMethod.CASH,
            amount: 999
          }
        ]
      }
    ]);
    prismaMock.saleReturn.findMany.mockResolvedValue([
      {
        id: "return-1",
        saleId: "sale-1",
        cashierId: "cashier-1",
        reason: "Producto regresado",
        refundMethod: PaymentMethod.CASH,
        refundTotal: 50,
        createdAt: new Date("2026-05-20T12:00:00.000Z"),
        updatedAt: new Date("2026-05-20T12:00:00.000Z"),
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
        status: "CLOSED",
        openingAmount: 100,
        expectedClosingAmount: 250,
        closingAmount: 250,
        difference: 0,
        openedAt: new Date("2026-05-20T08:00:00.000Z"),
        closedAt: new Date("2026-05-20T18:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Caja 1",
          email: "cashier@pos.local"
        }
      }
    ]);
    prismaMock.cashMovement.findMany.mockResolvedValue([
      {
        id: "movement-1",
        type: CashMovementType.SALE_CASH,
        amount: 200,
        createdAt: new Date("2026-05-20T10:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Caja 1",
          email: "cashier@pos.local"
        }
      },
      {
        id: "movement-2",
        type: CashMovementType.RETURN_CASH,
        amount: 50,
        createdAt: new Date("2026-05-20T12:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Caja 1",
          email: "cashier@pos.local"
        }
      }
    ]);
    prismaMock.saleItem.findMany.mockResolvedValue([
      {
        productId: "product-1",
        productSku: "CAF-001",
        productName: "Café",
        quantity: 5,
        total: 200
      }
    ]);
    prismaMock.saleReturnItem.findMany.mockResolvedValue([
      {
        productId: "product-1",
        productSku: "CAF-001",
        productName: "Café",
        quantity: 1,
        total: 50
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
    expect(report.sales.paymentSummary).toEqual({
      CASH: 200
    });
    expect(report.returns.byMethod).toEqual({
      CASH: 50
    });
    expect(report.sales.bySeller).toEqual([
      {
        seller: {
          id: "cashier-1",
          name: "Caja 1",
          email: "cashier@pos.local"
        },
        count: 1,
        gross: 200,
        refunded: 50,
        net: 150
      }
    ]);
    expect(report.cashRegister.movements.summary).toEqual({
      SALE_CASH: 200,
      RETURN_CASH: 50
    });
    expect(report.topProducts).toEqual([
      {
        product: {
          id: "product-1",
          sku: "CAF-001",
          name: "Café"
        },
        quantity: 4,
        total: 150
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
});
