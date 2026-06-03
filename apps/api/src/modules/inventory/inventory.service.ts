import { InventoryType, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

import { movementInclude } from "./inventory.mappers";
import {
  DEFAULT_WAREHOUSE_NAME,
  EXPIRATION_REASON_LABEL,
  INVENTORY_REASON_TYPES,
  type StockMovementInput,
  type WarehouseInput
} from "./inventory.shared";

export { DEFAULT_WAREHOUSE_NAME } from "./inventory.shared";

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
      sku: true,
      name: true,
      costPrice: true,
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


function normalizeMovementReason(input: StockMovementInput) {
  const reasonType = input.reasonType ?? INVENTORY_REASON_TYPES.OTHER;

  if (reasonType === INVENTORY_REASON_TYPES.EXPIRATION && input.type !== InventoryType.OUT) {
    throw new AppError(400, "Caducidad solo puede registrarse como salida de inventario");
  }

  return {
    reasonType,
    reason: reasonType === INVENTORY_REASON_TYPES.EXPIRATION
      ? EXPIRATION_REASON_LABEL
      : input.reason?.trim() || null
  };
}


function normalizeWarehouseName(name: string) {
  return name.trim().replace(/\s+/gu, " ");
}

function normalizeWarehouseDescription(description?: string | null) {
  const normalized = description?.trim().replace(/\s+/gu, " ") ?? "";

  return normalized || null;
}

function isPrismaUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createWarehouse(input: WarehouseInput) {
  const name = normalizeWarehouseName(input.name);
  const description = normalizeWarehouseDescription(input.description);

  const existingWarehouse = await prisma.warehouse.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (existingWarehouse?.isActive) {
    throw new AppError(409, `Ya existe un almacén activo con el nombre ${existingWarehouse.name}.`);
  }

  if (existingWarehouse && !existingWarehouse.isActive) {
    throw new AppError(409, `Ya existe un almacén inactivo con el nombre ${existingWarehouse.name}. Reactívalo antes de reutilizarlo.`);
  }

  try {
    return await prisma.warehouse.create({
      data: {
        name,
        description,
        isActive: true
      }
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new AppError(409, "Ya existe un almacén con ese nombre.");
    }

    throw error;
  }
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

export type ProductStockBreakdown = {
  total: number;
  locations: Array<{
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }>;
};

export async function getProductStockBreakdown(
  productIds?: string[]
): Promise<Map<string, ProductStockBreakdown>> {
  if (productIds && productIds.length === 0) {
    return new Map<string, ProductStockBreakdown>();
  }

  const balances = await prisma.inventoryBalance.findMany({
    where: productIds
      ? {
          productId: {
            in: productIds
          }
        }
      : undefined,
    include: {
      warehouse: {
        select: {
          id: true,
          name: true
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

  const stockByProduct = new Map<string, ProductStockBreakdown>();

  for (const balance of balances) {
    const current = stockByProduct.get(balance.productId) ?? {
      total: 0,
      locations: []
    };
    const quantity = balance.quantity ?? 0;

    current.total += quantity;

    current.locations.push({
      warehouseId: balance.warehouse.id,
      warehouseName: balance.warehouse.name,
      quantity
    });

    stockByProduct.set(balance.productId, current);
  }

  return stockByProduct;
}

export async function getProductStocks(productIds?: string[]): Promise<Map<string, number>> {
  const breakdown = await getProductStockBreakdown(productIds);

  return new Map(
    [...breakdown.entries()].map(([productId, stock]) => [productId, stock.total])
  );
}

export async function recordInventoryIn(input: Omit<StockMovementInput, "type">) {
  return prisma.$transaction((tx) =>
    increaseStock(tx, {
      ...input,
      type: InventoryType.IN
    })
  );
}

export async function recordInventoryOut(input: Omit<StockMovementInput, "type">) {
  return prisma.$transaction((tx) =>
    decreaseStock(tx, {
      ...input,
      type: InventoryType.OUT
    })
  );
}

export async function increaseStock(
  tx: Prisma.TransactionClient,
  input: StockMovementInput
) {
  const product = await assertActiveProduct(tx, input.productId);

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

  const movementReason = normalizeMovementReason(input);

  return tx.inventoryMovement.create({
    data: {
      product: {
        connect: {
          id: input.productId
        }
      },
      productSku: product.sku,
      productName: product.name,
      warehouse: {
        connect: {
          id: warehouse.id
        }
      },
      type: input.type,
      quantity: input.quantity,
      reason: movementReason.reason,
      reasonType: movementReason.reasonType,
      unitCostAtMovement: product.costPrice,
      costAmount: new Prisma.Decimal(product.costPrice).mul(input.quantity),
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

  const movementReason = normalizeMovementReason(input);

  return tx.inventoryMovement.create({
    data: {
      product: {
        connect: {
          id: input.productId
        }
      },
      productSku: product.sku,
      productName: product.name,
      warehouse: {
        connect: {
          id: warehouse.id
        }
      },
      type: input.type,
      quantity: input.quantity,
      reason: movementReason.reason,
      reasonType: movementReason.reasonType,
      unitCostAtMovement: product.costPrice,
      costAmount: new Prisma.Decimal(product.costPrice).mul(input.quantity),
      createdBy: input.createdBy
    },
    include: movementInclude
  });
}
