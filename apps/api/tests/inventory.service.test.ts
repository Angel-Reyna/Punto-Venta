import { AppError } from "../src/utils/AppError";

const mockPrisma = {
  inventoryBalance: {
    groupBy: jest.fn(),
    findMany: jest.fn()
  },
  warehouse: {
    findFirst: jest.fn(),
    create: jest.fn()
  },
  $transaction: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: mockPrisma
}));

import {
  createWarehouse,
  decreaseStock,
  getOrCreateSellerWarehouse,
  getProductStockBreakdown,
  getProductStocks,
  increaseStock
} from "../src/modules/inventory/inventory.service";

function createTransactionMock() {
  return {
    product: {
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    warehouse: {
      findUnique: jest.fn(),
      upsert: jest.fn()
    },
    inventoryBalance: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn()
    },
    inventoryMovement: {
      create: jest.fn()
    }
  };
}

describe("inventory.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe("createWarehouse", () => {
    it("normalizes and creates an active warehouse", async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue(null);
      mockPrisma.warehouse.create.mockResolvedValue({
        id: "warehouse-2",
        name: "Bodega norte",
        description: "Mercancía de respaldo",
        isActive: true
      });

      const result = await createWarehouse({
        name: "  Bodega   norte  ",
        description: "  Mercancía   de respaldo  "
      });

      expect(mockPrisma.warehouse.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: "Bodega norte",
            mode: "insensitive"
          }
        },
        select: {
          id: true,
          name: true,
          isActive: true
        }
      });
      expect(mockPrisma.warehouse.create).toHaveBeenCalledWith({
        data: {
          name: "Bodega norte",
          description: "Mercancía de respaldo",
          type: "STORAGE",
          isActive: true
        }
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: "warehouse-2",
          name: "Bodega norte"
        })
      );
    });

    it("blocks duplicated active warehouse names", async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: "warehouse-1",
        name: "Principal",
        isActive: true
      });

      await expect(createWarehouse({ name: "principal" })).rejects.toMatchObject({
        statusCode: 409,
        message: "Ya existe un almacén activo con el nombre Principal."
      } satisfies Partial<AppError>);

      expect(mockPrisma.warehouse.create).not.toHaveBeenCalled();
    });
  });



  describe("getOrCreateSellerWarehouse", () => {
    it("creates or reactivates a seller warehouse for active cashiers", async () => {
      const tx = createTransactionMock();
      tx.user.findUnique.mockResolvedValue({
        id: "seller-1",
        name: "Vendedor Uno",
        email: "vendedor@pos.local",
        role: "CASHIER",
        isActive: true
      });
      tx.warehouse.upsert.mockResolvedValue({
        id: "seller-warehouse-1",
        name: "Stock vendedor: Vendedor Uno (vendedor@pos.local)",
        type: "SELLER",
        sellerId: "seller-1",
        isActive: true
      });

      const result = await getOrCreateSellerWarehouse(tx as never, "seller-1");

      expect(tx.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: "seller-1"
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      expect(tx.warehouse.upsert).toHaveBeenCalledWith({
        where: {
          sellerId: "seller-1"
        },
        update: expect.objectContaining({
          name: "Stock vendedor: Vendedor Uno (vendedor@pos.local)",
          type: "SELLER",
          isActive: true
        }),
        create: expect.objectContaining({
          name: "Stock vendedor: Vendedor Uno (vendedor@pos.local)",
          type: "SELLER",
          seller: {
            connect: {
              id: "seller-1"
            }
          },
          isActive: true
        })
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: "seller-warehouse-1",
          type: "SELLER"
        })
      );
    });

    it("rejects admin users as seller stock owners", async () => {
      const tx = createTransactionMock();
      tx.user.findUnique.mockResolvedValue({
        id: "admin-1",
        name: "Admin",
        email: "admin@pos.local",
        role: "ADMIN",
        isActive: true
      });

      await expect(
        getOrCreateSellerWarehouse(tx as never, "admin-1")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "El usuario seleccionado no es vendedor."
      } satisfies Partial<AppError>);

      expect(tx.warehouse.upsert).not.toHaveBeenCalled();
    });
  });

  describe("getProductStocks", () => {
    it("returns an empty map without querying when product list is empty", async () => {
      const result = await getProductStocks([]);

      expect(result.size).toBe(0);
      expect(mockPrisma.inventoryBalance.groupBy).not.toHaveBeenCalled();
    });


    it("keeps zero-stock warehouse locations in the stock breakdown", async () => {
      mockPrisma.inventoryBalance.findMany.mockResolvedValue([
        {
          productId: "product-1",
          quantity: 24,
          warehouse: {
            id: "warehouse-1",
            name: "Principal",
            type: "STORAGE",
            sellerId: null
          }
        },
        {
          productId: "product-1",
          quantity: 0,
          warehouse: {
            id: "warehouse-2",
            name: "Bodega norte",
            type: "STORAGE",
            sellerId: null
          }
        }
      ]);

      const result = await getProductStockBreakdown(["product-1"]);

      expect(result.get("product-1")).toEqual({
        total: 24,
        locations: [
          {
            warehouseId: "warehouse-1",
            warehouseName: "Principal",
            warehouseType: "STORAGE",
            sellerId: null,
            quantity: 24
          },
          {
            warehouseId: "warehouse-2",
            warehouseName: "Bodega norte",
            warehouseType: "STORAGE",
            sellerId: null,
            quantity: 0
          }
        ]
      });
    });

    it("aggregates stock by product id", async () => {
      mockPrisma.inventoryBalance.findMany.mockResolvedValue([
        {
          productId: "product-1",
          quantity: 5,
          warehouse: {
            id: "warehouse-1",
            name: "Principal",
            type: "STORAGE",
            sellerId: null
          }
        },
        {
          productId: "product-1",
          quantity: 3,
          warehouse: {
            id: "warehouse-2",
            name: "Bodega norte",
            type: "STORAGE",
            sellerId: null
          }
        },
        {
          productId: "product-2",
          quantity: 0,
          warehouse: {
            id: "warehouse-1",
            name: "Principal",
            type: "STORAGE",
            sellerId: null
          }
        }
      ]);

      const result = await getProductStocks(["product-1", "product-2"]);

      expect(mockPrisma.inventoryBalance.findMany).toHaveBeenCalledWith({
        where: {
          productId: {
            in: ["product-1", "product-2"]
          }
        },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              type: true,
              sellerId: true
            }
          }
        },
        orderBy: [
          {
            warehouse: {
              name: "asc"
            }
          }
        ]
      });
      expect(result.get("product-1")).toBe(8);
      expect(result.get("product-2")).toBe(0);
    });
  });

  describe("increaseStock", () => {
    it("increments balance and records an inventory movement", async () => {
      const tx = createTransactionMock();
      tx.product.findUnique.mockResolvedValue({
        id: "product-1",
        sku: "CAFE-250",
        name: "Café",
        costPrice: 10,
        isActive: true
      });
      tx.warehouse.findUnique.mockResolvedValue({
        id: "warehouse-1",
        name: "Principal",
        isActive: true
      });
      tx.inventoryMovement.create.mockResolvedValue({
        id: "movement-1"
      });

      const result = await increaseStock(tx as never, {
        productId: "product-1",
        warehouseId: "warehouse-1",
        quantity: 5,
        reason: "Compra inicial",
        createdBy: "admin-1",
        type: "IN"
      });

      expect(tx.inventoryBalance.upsert).toHaveBeenCalledWith({
        where: {
          productId_warehouseId: {
            productId: "product-1",
            warehouseId: "warehouse-1"
          }
        },
        update: {
          quantity: {
            increment: 5
          }
        },
        create: {
          productId: "product-1",
          warehouseId: "warehouse-1",
          quantity: 5
        }
      });
      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            product: {
              connect: {
                id: "product-1"
              }
            },
            productSku: "CAFE-250",
            productName: "Café",
            warehouse: {
              connect: {
                id: "warehouse-1"
              }
            },
            type: "IN",
            quantity: 5,
            reason: "Compra inicial",
            reasonType: "OTHER",
            createdBy: "admin-1"
          }),
          include: expect.any(Object)
        })
      );
      expect(result).toEqual({ id: "movement-1" });
    });
  });

  describe("decreaseStock", () => {
    it("uses a conditional atomic decrement to prevent overselling", async () => {
      const tx = createTransactionMock();
      tx.product.findUnique.mockResolvedValue({
        id: "product-1",
        sku: "CAFE-250",
        name: "Café",
        costPrice: 10,
        isActive: true
      });
      tx.warehouse.findUnique.mockResolvedValue({
        id: "warehouse-1",
        name: "Principal",
        isActive: true
      });
      tx.inventoryBalance.updateMany.mockResolvedValue({
        count: 1
      });
      tx.inventoryMovement.create.mockResolvedValue({
        id: "movement-1"
      });

      await decreaseStock(tx as never, {
        productId: "product-1",
        warehouseId: "warehouse-1",
        quantity: 3,
        reason: "Venta",
        createdBy: "cashier-1",
        type: "SALE"
      });

      expect(tx.inventoryBalance.updateMany).toHaveBeenCalledWith({
        where: {
          productId: "product-1",
          warehouseId: "warehouse-1",
          quantity: {
            gte: 3
          }
        },
        data: {
          quantity: {
            decrement: 3
          }
        }
      });
      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            product: {
              connect: {
                id: "product-1"
              }
            },
            productSku: "CAFE-250",
            productName: "Café",
            warehouse: {
              connect: {
                id: "warehouse-1"
              }
            },
            type: "SALE",
            quantity: 3,
            reason: "Venta",
            reasonType: "OTHER",
            createdBy: "cashier-1"
          }),
          include: expect.any(Object)
        })
      );
    });

    it("records expiration shrinkage with a structured reason type", async () => {
      const tx = createTransactionMock();
      tx.product.findUnique.mockResolvedValue({
        id: "product-1",
        sku: "CAFE-250",
        name: "Café",
        costPrice: 10,
        isActive: true
      });
      tx.warehouse.findUnique.mockResolvedValue({
        id: "warehouse-1",
        name: "Principal",
        isActive: true
      });
      tx.inventoryBalance.updateMany.mockResolvedValue({
        count: 1
      });
      tx.inventoryMovement.create.mockResolvedValue({
        id: "movement-expiration"
      });

      await decreaseStock(tx as never, {
        productId: "product-1",
        warehouseId: "warehouse-1",
        quantity: 2,
        reasonType: "EXPIRATION",
        reason: "Texto ignorado",
        createdBy: "admin-1",
        type: "OUT"
      });

      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "OUT",
            quantity: 2,
            reason: "Caducidad",
            reasonType: "EXPIRATION",
            unitCostAtMovement: 10,
            costAmount: expect.any(Object)
          })
        })
      );
    });

    it("throws 409 with current stock when the atomic decrement fails", async () => {
      const tx = createTransactionMock();
      tx.product.findUnique.mockResolvedValue({
        id: "product-1",
        name: "Café",
        costPrice: 10,
        isActive: true
      });
      tx.warehouse.findUnique.mockResolvedValue({
        id: "warehouse-1",
        name: "Principal",
        isActive: true
      });
      tx.inventoryBalance.updateMany.mockResolvedValue({
        count: 0
      });
      tx.inventoryBalance.findUnique.mockResolvedValue({
        quantity: 2
      });

      await expect(
        decreaseStock(tx as never, {
          productId: "product-1",
          warehouseId: "warehouse-1",
          quantity: 3,
          reason: "Venta",
          createdBy: "cashier-1",
          type: "SALE",
          insufficientStockMessage: "Stock insuficiente para Café."
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Stock insuficiente para Café. Almacén: Principal. Stock actual: 2."
      } satisfies Partial<AppError>);

      expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    });

    it("rejects inactive products before touching stock", async () => {
      const tx = createTransactionMock();
      tx.product.findUnique.mockResolvedValue({
        id: "product-1",
        name: "Café",
        costPrice: 10,
        isActive: false
      });

      await expect(
        decreaseStock(tx as never, {
          productId: "product-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          reason: "Venta",
          createdBy: "cashier-1",
          type: "SALE"
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Producto inactivo: Café"
      } satisfies Partial<AppError>);

      expect(tx.inventoryBalance.updateMany).not.toHaveBeenCalled();
    });
  });
});
