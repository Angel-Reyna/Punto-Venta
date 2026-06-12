const prismaMock = {
  inventoryMovement: {
    count: jest.fn(),
    findMany: jest.fn()
  },
  warehouse: {
    findMany: jest.fn()
  },
  inventoryTransferRequest: {
    findMany: jest.fn()
  }
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

import { Role } from "@prisma/client";

import {
  listInventoryMovements,
  listInventoryTransferRequests,
  listSellerStock
} from "../src/modules/inventory/inventory.queries";

describe("inventory.queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.inventoryMovement.count.mockResolvedValue(0);
    prismaMock.inventoryMovement.findMany.mockResolvedValue([]);
    prismaMock.warehouse.findMany.mockResolvedValue([]);
    prismaMock.inventoryTransferRequest.findMany.mockResolvedValue([]);
  });

  it.each(["merma", "caducidad", "daños", "danios", "expiration", "damage", "vencimiento"])(
    "maps inventory movement search term %s to shrinkage reason types",
    async (q) => {
      await listInventoryMovements({ q });

      expect(prismaMock.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                reasonType: {
                  in: ["EXPIRATION", "DAMAGE"]
                }
              }
            ])
          })
        })
      );
      expect(prismaMock.inventoryMovement.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                reasonType: {
                  in: ["EXPIRATION", "DAMAGE"]
                }
              }
            ])
          })
        })
      );
    }
  );

  it("keeps standard text filters without adding expiration alias for unrelated searches", async () => {
    await listInventoryMovements({ q: "cafe" });

    const where = prismaMock.inventoryMovement.findMany.mock.calls[0][0].where;

    expect(where.OR).toEqual(
      expect.arrayContaining([
        {
          reason: {
            contains: "cafe",
            mode: "insensitive"
          }
        },
        {
          productSku: {
            contains: "cafe",
            mode: "insensitive"
          }
        },
        {
          productName: {
            contains: "cafe",
            mode: "insensitive"
          }
        }
      ])
    );
    expect(where.OR).not.toContainEqual({
      reasonType: {
        in: ["EXPIRATION", "DAMAGE"]
      }
    });
  });
});


describe("listSellerStock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.warehouse.findMany.mockResolvedValue([]);
  });

  it("scopes seller stock to the current seller", async () => {
    prismaMock.warehouse.findMany.mockResolvedValue([
      {
        id: "seller-warehouse-1",
        name: "Stock vendedor: Vendedor Uno",
        description: "Stock físico asignado",
        type: "SELLER",
        sellerId: "seller-1",
        isActive: true,
        seller: {
          id: "seller-1",
          name: "Vendedor Uno",
          email: "vendedor@pos.local"
        },
        inventoryBalances: [
          {
            productId: "product-1",
            quantity: 4,
            product: {
              id: "product-1",
              sku: "CAFE-250",
              barcode: null,
              name: "Café",
              minStock: 2,
              isActive: true
            }
          }
        ]
      }
    ]);

    const result = await listSellerStock(
      { id: "seller-1", role: Role.CASHIER },
      {}
    );

    expect(prismaMock.warehouse.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "SELLER",
          isActive: true,
          sellerId: "seller-1"
        })
      })
    );
    expect(result).toEqual([
      expect.objectContaining({
        seller: {
          id: "seller-1",
          name: "Vendedor Uno",
          email: "vendedor@pos.local"
        },
        totalUnits: 4,
        products: [
          expect.objectContaining({
            productId: "product-1",
            sku: "CAFE-250",
            quantity: 4
          })
        ]
      })
    ]);
  });



  it("blocks sellers from filtering another seller stock", async () => {
    await expect(
      listSellerStock(
        { id: "seller-1", role: Role.CASHIER },
        { sellerId: "seller-2" }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "No autorizado"
    });

    expect(prismaMock.warehouse.findMany).not.toHaveBeenCalled();
  });

  it("allows admins to filter seller stock by seller id", async () => {
    await listSellerStock(
      { id: "admin-1", role: Role.ADMIN },
      { sellerId: "seller-2" }
    );

    expect(prismaMock.warehouse.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "SELLER",
          isActive: true,
          sellerId: "seller-2"
        })
      })
    );
  });
});


describe("listInventoryTransferRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.inventoryTransferRequest.findMany.mockResolvedValue([]);
  });

  it("scopes transfer requests to the current seller", async () => {
    await listInventoryTransferRequests(
      { id: "seller-1", role: Role.CASHIER },
      {}
    );

    expect(prismaMock.inventoryTransferRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          requestedById: "seller-1"
        })
      })
    );
  });

  it("blocks sellers from filtering another seller transfer requests", async () => {
    await expect(
      listInventoryTransferRequests(
        { id: "seller-1", role: Role.CASHIER },
        { sellerId: "seller-2" }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "No autorizado"
    });

    expect(prismaMock.inventoryTransferRequest.findMany).not.toHaveBeenCalled();
  });

  it("allows admins to filter transfer requests by status and seller", async () => {
    await listInventoryTransferRequests(
      { id: "admin-1", role: Role.ADMIN },
      {
        sellerId: "seller-2",
        status: "PENDING"
      }
    );

    expect(prismaMock.inventoryTransferRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          requestedById: "seller-2",
          status: "PENDING"
        })
      })
    );
  });
});
