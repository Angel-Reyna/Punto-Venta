import { Prisma, type InventoryType } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

const DEFAULT_WAREHOUSE_NAME = "Principal";

type StockMovementInput = {
  productId: string;
  warehouseId?: string | null;
  quantity: number;
  reason?: string | null;
  createdBy: string;
  type: InventoryType;
  insufficientStockMessage?: string;
};

const movementInclude = {
  product: {
    select: {
      id: true,
      sku: true,
      name: true
    }
  },
  warehouse: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.InventoryMovementInclude;

async function assertActiveProduct(
  tx: Prisma.TransactionClient,
  productId: string
) {
  const product = await tx.product.findUnique({
    where: {
      id: productId
    },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (!product) {
    throw new AppError(404, "Producto no encontrado");
  }

  if (!product.isActive) {
    throw new AppError(400, `Producto inactivo: ${product.name}`);
  }

  return product;
}

async function resolveWarehouse(
  tx: Prisma.TransactionClient,
  warehouseId?: string | null
) {
  if (!warehouseId) {
    return getOrCreateDefaultWarehouse(tx);
  }

  const warehouse = await tx.warehouse.findUnique({
    where: {
      id: warehouseId
    },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (!warehouse) {
    throw new AppError(404, "Almacén no encontrado");
  }

  if (!warehouse.isActive) {
    throw new AppError(400, `Almacén inactivo: ${warehouse.name}`);
  }

  return warehouse;
}

export async function getOrCreateDefaultWarehouse(
  tx: Prisma.TransactionClient
) {
  return tx.warehouse.upsert({
    where: {
      name: DEFAULT_WAREHOUSE_NAME
    },
    update: {
      isActive: true
    },
    create: {
      name: DEFAULT_WAREHOUSE_NAME,
      description: "Almacén principal",
      isActive: true
    }
  });
}

export async function getProductStocks(productIds?: string[]): Promise<Map<string, number>> {
  if (productIds && productIds.length === 0) {
    return new Map<string, number>();
  }

  const balances = await prisma.inventoryBalance.groupBy({
    by: ["productId"],
    where: productIds
      ? {
          productId: {
            in: productIds
          }
        }
      : undefined,
    _sum: {
      quantity: true
    }
  });

  return new Map(
    balances.map((balance: { productId: string; _sum: { quantity: number | null } }) => [
      balance.productId,
      balance._sum.quantity ?? 0
    ])
  );
}

export async function increaseStock(
  tx: Prisma.TransactionClient,
  input: StockMovementInput
) {
  await assertActiveProduct(tx, input.productId);

  const warehouse = await resolveWarehouse(tx, input.warehouseId);

  await tx.inventoryBalance.upsert({
    where: {
      productId_warehouseId: {
        productId: input.productId,
        warehouseId: warehouse.id
      }
    },
    update: {
      quantity: {
        increment: input.quantity
      }
    },
    create: {
      productId: input.productId,
      warehouseId: warehouse.id,
      quantity: input.quantity
    }
  });

  return tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      warehouseId: warehouse.id,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      createdBy: input.createdBy
    },
    include: movementInclude
  });
}

export async function decreaseStock(
  tx: Prisma.TransactionClient,
  input: StockMovementInput
) {
  const product = await assertActiveProduct(tx, input.productId);

  const warehouse = await resolveWarehouse(tx, input.warehouseId);

  const updateResult = await tx.inventoryBalance.updateMany({
    where: {
      productId: input.productId,
      warehouseId: warehouse.id,
      quantity: {
        gte: input.quantity
      }
    },
    data: {
      quantity: {
        decrement: input.quantity
      }
    }
  });

  if (updateResult.count !== 1) {
    const balance = await tx.inventoryBalance.findUnique({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: warehouse.id
        }
      },
      select: {
        quantity: true
      }
    });

    const currentStock = balance?.quantity ?? 0;

    throw new AppError(
      409,
      `${input.insufficientStockMessage ?? `Stock insuficiente para ${product.name}.`} Stock actual: ${currentStock}.`
    );
  }

  return tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      warehouseId: warehouse.id,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      createdBy: input.createdBy
    },
    include: movementInclude
  });
}
