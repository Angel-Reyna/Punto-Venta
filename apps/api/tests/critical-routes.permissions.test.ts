import request from "supertest";
import { Role } from "@prisma/client";

const prismaMock = {
  user: {
    findUnique: jest.fn()
  },
  product: {
    count: jest.fn(),
    findMany: jest.fn()
  }
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

const authTokensMock = {
  verifyAccessToken: jest.fn()
};

jest.mock("../src/modules/auth/auth.tokens", () => authTokensMock);

const sellerActivityMock = {
  logSellerActivity: jest.fn(),
  shouldLogSellerActivity: jest.fn((user?: { role: Role }) => user?.role === Role.CASHIER)
};

jest.mock("../src/modules/seller-activity/seller-activity.service", () => sellerActivityMock);

const inventoryServiceMock = {
  getProductStocks: jest.fn()
};

jest.mock("../src/modules/inventory/inventory.service", () => inventoryServiceMock);

const cashRegisterServiceMock = {
  getCurrentCashRegister: jest.fn()
};

jest.mock("../src/modules/cash-register/cash-register.service", () => cashRegisterServiceMock);

const salesServiceMock = {
  createSale: jest.fn(),
  listSales: jest.fn(),
  getSaleById: jest.fn(),
  cancelSale: jest.fn(),
  returnSaleItems: jest.fn(),
  saleSchema: jest.requireActual("../src/modules/sales/sales.service").saleSchema,
  cancelSaleSchema: jest.requireActual("../src/modules/sales/sales.service").cancelSaleSchema,
  returnSaleSchema: jest.requireActual("../src/modules/sales/sales.service").returnSaleSchema
};

jest.mock("../src/modules/sales/sales.service", () => salesServiceMock);

jest.mock("../src/modules/audit/audit.service", () => ({
  auditLog: jest.fn()
}));

const reportsServiceMock = {
  getSalesReport: jest.fn(),
  getOperationsReport: jest.fn(),
  parseReportDateRange: jest.requireActual("../src/modules/reports/reports.service").parseReportDateRange
};

jest.mock("../src/modules/reports/reports.service", () => reportsServiceMock);

import { app } from "../src/app";

const AUTH_HEADER = {
  Authorization: "Bearer test-access-token"
};

const ADMIN_USER = {
  id: "admin-1",
  email: "admin@pos.local",
  role: Role.ADMIN,
  isActive: true
};

const CASHIER_USER = {
  id: "cashier-1",
  email: "cashier@pos.local",
  role: Role.CASHIER,
  isActive: true
};

function authenticateAs(user: typeof ADMIN_USER | typeof CASHIER_USER) {
  authTokensMock.verifyAccessToken.mockReturnValue({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: "access"
  });
  prismaMock.user.findUnique.mockResolvedValue(user);
}

describe("critical route permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authenticateAs(CASHIER_USER);
  });

  it.each([
    ["crear producto", "post", "/api/products", { sku: "SKU-1", name: "Producto", costPrice: 1, salePrice: 2 }],
    ["importar productos", "post", "/api/products/import/excel", undefined],
    ["activar/desactivar producto", "patch", "/api/products/00000000-0000-4000-8000-000000000001/toggle", undefined],
    ["eliminar producto", "delete", "/api/products/00000000-0000-4000-8000-000000000001", undefined],
    [
      "registrar entrada de inventario",
      "post",
      "/api/inventory/in",
      {
        productId: "00000000-0000-4000-8000-000000000003",
        quantity: 1,
        reason: "Prueba de permiso"
      }
    ],
    [
      "registrar salida de inventario",
      "post",
      "/api/inventory/out",
      {
        productId: "00000000-0000-4000-8000-000000000003",
        quantity: 1,
        reason: "Prueba de permiso"
      }
    ],
    ["consultar caja actual", "get", "/api/cash-register/current", undefined],
    ["movimiento manual de caja", "post", "/api/cash-register/movements", { type: "IN", amount: 10, reason: "Ajuste manual" }],
    ["cancelar venta", "post", "/api/sales/00000000-0000-4000-8000-000000000002/cancel", { reason: "Prueba de permiso" }],
    ["registrar devolución", "post", "/api/sales/00000000-0000-4000-8000-000000000002/returns", { reason: "Prueba de permiso", items: [] }],
    ["consultar reportes", "get", "/api/reports/operations", undefined],
    ["consultar usuarios", "get", "/api/users", undefined],
    ["consultar auditoría", "get", "/api/audit", undefined],
    ["consultar actividad de vendedores", "get", "/api/seller-activity", undefined]
  ] as const)(
    "blocks CASHIER direct access to admin action: %s",
    async (_label, method, path, body) => {
      const response = await request(app)
        [method](path)
        .set(AUTH_HEADER)
        .send(body ?? {});

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("No autorizado");
      expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: CASHIER_USER.id,
          action: "FAILED_ACCESS_ATTEMPT"
        })
      );
    }
  );

  it("allows CASHIER to read products without exposing admin-only fields", async () => {
    prismaMock.product.count.mockResolvedValue(1);
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        sku: "SKU-1",
        barcode: "COD-1",
        name: "Producto prueba",
        description: null,
        costPrice: 50,
        salePrice: 100,
        promoPercent: 0,
        minStock: 1,
        isActive: true,
        categoryId: null,
        createdAt: new Date("2026-05-18T00:00:00.000Z"),
        updatedAt: new Date("2026-05-18T00:00:00.000Z"),
        category: null
      }
    ]);
    inventoryServiceMock.getProductStocks.mockResolvedValue(new Map([["product-1", 10]]));

    const response = await request(app).get("/api/products").set(AUTH_HEADER);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: "product-1",
        sku: "SKU-1",
        barcode: "COD-1",
        name: "Producto prueba",
        salePrice: 100,
        promoPercent: 0,
        finalPrice: 100,
        stock: 10
      })
    ]);
    expect(response.body[0]).not.toHaveProperty("costPrice");
    expect(response.body[0]).not.toHaveProperty("marginPercent");
  });

  it("allows CASHIER to create sales when request is valid", async () => {
    salesServiceMock.createSale.mockResolvedValue({
      id: "sale-1",
      folio: "SALE-20260518-ABC123",
      total: 100,
      status: "COMPLETED"
    });

    const response = await request(app)
      .post("/api/sales")
      .set(AUTH_HEADER)
      .send({
        paymentMethod: "CARD",
        items: [
          {
            productId: "00000000-0000-4000-8000-000000000003",
            quantity: 1
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(salesServiceMock.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        id: CASHIER_USER.id,
        role: Role.CASHIER
      }),
      expect.objectContaining({
        paymentMethod: "CARD"
      }),
      expect.objectContaining({
        ipAddress: expect.any(String)
      })
    );
  });

  it("allows ADMIN to reach reports endpoints protected by ReportsRead", async () => {
    authenticateAs(ADMIN_USER);

    reportsServiceMock.getOperationsReport.mockResolvedValue({
      period: {
        from: "2026-05-18",
        to: "2026-05-18"
      },
      generatedAt: "2026-05-18T00:00:00.000Z",
      totals: {},
      salesByStatus: [],
      paymentsByMethod: [],
      refundsByMethod: [],
      cashMovementsByType: [],
      topProducts: [],
      recentSales: [],
      cashRegisterSessions: [],
      returns: []
    });

    const response = await request(app)
      .get("/api/reports/operations?from=2026-05-18&to=2026-05-18")
      .set(AUTH_HEADER);

    expect(response.status).toBe(200);
  });
});
