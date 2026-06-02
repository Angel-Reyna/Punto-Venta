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

function buildOperationsReportFixture() {
  const seller = {
    id: "cashier-1",
    name: "Vendedor Uno",
    email: "vendedor@pos.local"
  };

  return {
    from: new Date("2026-05-18T00:00:00.000Z"),
    to: new Date("2026-05-18T23:59:59.999Z"),
    fromLabel: "2026-05-18",
    toLabel: "2026-05-18",
    sales: {
      count: 1,
      activeCount: 1,
      unitsSold: 2,
      unitsReturned: 1,
      unitsNet: 1,
      unitsPerTransaction: 1,
      byStatus: {
        COMPLETED: 1
      },
      daily: [
        {
          date: "2026-05-18",
          count: 1,
          gross: 120,
          refunded: 20,
          net: 100,
          units: 1
        }
      ],
      gross: 120,
      refunded: 20,
      net: 100,
      paymentSummary: {
        CASH: 120
      },
      profit: {
        grossCost: 70,
        returnedCost: 10,
        netCost: 60,
        grossProfit: 50,
        returnedProfit: 10,
        netProfit: 40,
        marginPercent: 40
      },
      bySeller: [
        {
          seller,
          count: 1,
          gross: 120,
          refunded: 20,
          net: 100
        }
      ],
      recent: [
        {
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          status: "COMPLETED",
          total: 120,
          createdAt: new Date("2026-05-18T12:00:00.000Z"),
          cashier: seller,
          payments: [
            {
              id: "payment-1",
              method: "CASH",
              amount: 120
            }
          ]
        }
      ]
    },
    returns: {
      count: 1,
      total: 20,
      byMethod: {
        CASH: 20
      },
      latest: [
        {
          id: "return-1",
          saleId: "sale-1",
          cashierId: seller.id,
          reason: "Producto devuelto",
          refundMethod: "CASH",
          refundTotal: 20,
          createdAt: new Date("2026-05-18T13:00:00.000Z"),
          updatedAt: new Date("2026-05-18T13:00:00.000Z"),
          cashier: seller
        }
      ]
    },
    inventory: {
      movements: {
        count: 1,
        unitsIn: 0,
        unitsOut: 2,
        byType: {
          OUT: 2
        },
        byReasonType: {
          EXPIRATION: 2
        },
        latest: [
          {
            id: "inventory-1",
            type: "OUT",
            reasonType: "EXPIRATION",
            reason: "Caducidad",
            quantity: 2,
            unitCostAtMovement: 10,
            costAmount: 20,
            product: {
              id: "product-1",
              sku: "SKU-1",
              name: "Producto prueba"
            },
            warehouse: {
              id: "warehouse-1",
              name: "Principal"
            },
            createdAt: new Date("2026-05-18T10:00:00.000Z")
          }
        ]
      },
      shrinkage: {
        totalUnits: 2,
        totalCost: 20,
        byProduct: [
          {
            product: {
              id: "product-1",
              sku: "SKU-1",
              name: "Producto prueba"
            },
            quantity: 2,
            cost: 20
          }
        ],
        byWarehouse: [
          {
            warehouse: {
              id: "warehouse-1",
              name: "Principal"
            },
            quantity: 2,
            cost: 20
          }
        ],
        latest: [
          {
            id: "inventory-1",
            type: "OUT",
            reasonType: "EXPIRATION",
            reason: "Caducidad",
            quantity: 2,
            unitCostAtMovement: 10,
            costAmount: 20,
            product: {
              id: "product-1",
              sku: "SKU-1",
              name: "Producto prueba"
            },
            warehouse: {
              id: "warehouse-1",
              name: "Principal"
            },
            createdAt: new Date("2026-05-18T10:00:00.000Z")
          }
        ]
      }
    },
    cashRegister: {
      sessions: [
        {
          id: "session-1",
          status: "CLOSED",
          openingAmount: 100,
          expectedClosingAmount: 200,
          closingAmount: 200,
          difference: 0,
          openedAt: new Date("2026-05-18T08:00:00.000Z"),
          closedAt: new Date("2026-05-18T18:00:00.000Z"),
          cashier: seller
        }
      ],
      movements: {
        count: 1,
        summary: {
          SALE_CASH: 120
        }
      }
    },
    topProducts: [
      {
        product: {
          id: "product-1",
          sku: "SKU-1",
          name: "Producto prueba"
        },
        quantity: 2,
        total: 120,
        cost: 70,
        grossProfit: 50
      }
    ]
  };
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
    ["eliminar todos los productos", "delete", "/api/products", undefined],
    [
      "crear almacén de inventario",
      "post",
      "/api/inventory/warehouses",
      {
        name: "Bodega sin permiso"
      }
    ],
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
    ["descargar PDF de reportes", "get", "/api/reports/operations/pdf?from=2026-05-18&to=2026-05-18", undefined],
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

    reportsServiceMock.getOperationsReport.mockResolvedValue(
      buildOperationsReportFixture()
    );

    const response = await request(app)
      .get("/api/reports/operations?from=2026-05-18&to=2026-05-18")
      .set(AUTH_HEADER);

    expect(response.status).toBe(200);
  });

  it("rejects operations PDF downloads without an explicit date range", async () => {
    authenticateAs(ADMIN_USER);

    const response = await request(app)
      .get("/api/reports/operations/pdf")
      .set(AUTH_HEADER);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Debes enviar fecha inicial y fecha final");
    expect(reportsServiceMock.getOperationsReport).not.toHaveBeenCalled();
  });

  it("streams a readable operations PDF for ADMIN", async () => {
    authenticateAs(ADMIN_USER);
    reportsServiceMock.getOperationsReport.mockResolvedValue(
      buildOperationsReportFixture()
    );

    const response = await request(app)
      .get("/api/reports/operations/pdf?from=2026-05-18&to=2026-05-18")
      .set(AUTH_HEADER)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          chunks.push(Buffer.from(chunk));
        });
        res.on("end", () => {
          callback(null, Buffer.concat(chunks));
        });
      });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain(
      'attachment; filename="reporte-operativo-2026-05-18-2026-05-18.pdf"'
    );
    expect(response.headers["content-disposition"]).toContain("filename*=UTF-8''");
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect(response.body.subarray(0, 4).toString()).toBe("%PDF");

    const pdfText = response.body.toString("latin1");
    const pageCount = pdfText.match(/\/Type\s*\/Page\b/g)?.length ?? 0;

    expect(pageCount).toBeGreaterThanOrEqual(1);
    expect(pageCount).toBeLessThanOrEqual(8);
  });
});
