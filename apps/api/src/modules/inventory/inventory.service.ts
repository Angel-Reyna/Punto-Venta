import {
  InventoryTransferRequestStatus,
  InventoryType,
  Prisma,
  Role,
  WarehouseType
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

import { movementInclude } from "./inventory.mappers";
import {
  DEFAULT_WAREHOUSE_NAME,
  EXPIRATION_REASON_LABEL,
  INVENTORY_REASON_TYPES,
  type InventoryTransferRequestInput,
  type StockMovementInput,
  type WarehouseInput
} from "./inventory.shared";

export { DEFAULT_WAREHOUSE_NAME } from "./inventory.shared";

const INVENTORY_TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5_000,
  timeout: 15_000
} as const;

function isRetryableTransactionConflictError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

async function runInventoryTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(callback, INVENTORY_TRANSACTION_OPTIONS);
    } catch (error) {
      if (attempt < maxAttempts && isRetryableTransactionConflictError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(500, "No se pudo completar la transacción de inventario");
}

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
        type: WarehouseType.STORAGE,
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
      type: WarehouseType.STORAGE,
      sellerId: null,
      isActive: true
    },
    create: {
      name: DEFAULT_WAREHOUSE_NAME,
      description: "Almacén: Principal",
      type: WarehouseType.STORAGE,
      isActive: true
    }
  });
}

type SellerForStockWarehouse = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

function buildSellerWarehouseName(seller: SellerForStockWarehouse) {
  return `Stock vendedor: ${seller.name} (${seller.email})`;
}

async function assertActiveSeller(
  tx: Prisma.TransactionClient,
  sellerId: string
): Promise<SellerForStockWarehouse> {
  const seller = await tx.user.findUnique({
    where: {
      id: sellerId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  if (!seller) {
    throw new AppError(404, "Vendedor no encontrado");
  }

  if (seller.role !== Role.CASHIER) {
    throw new AppError(400, "El usuario seleccionado no es vendedor.");
  }

  if (!seller.isActive) {
    throw new AppError(400, `Vendedor inactivo: ${seller.name}`);
  }

  return seller;
}

export async function getOrCreateSellerWarehouse(
  tx: Prisma.TransactionClient,
  sellerId: string
) {
  const seller = await assertActiveSeller(tx, sellerId);
  const warehouseName = buildSellerWarehouseName(seller);

  return tx.warehouse.upsert({
    where: {
      sellerId: seller.id
    },
    update: {
      name: warehouseName,
      description: `Stock físico asignado a ${seller.name}.`,
      type: WarehouseType.SELLER,
      isActive: true
    },
    create: {
      name: warehouseName,
      description: `Stock físico asignado a ${seller.name}.`,
      type: WarehouseType.SELLER,
      seller: {
        connect: {
          id: seller.id
        }
      },
      isActive: true
    }
  });
}

export async function ensureSellerStockWarehouse(sellerId: string) {
  try {
    return await runInventoryTransaction((tx) =>
      getOrCreateSellerWarehouse(tx, sellerId)
    );
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new AppError(409, "Ya existe un almacén de vendedor con esos datos.");
    }

    throw error;
  }
}


type InventoryTransferRequestItemNormalized = {
  productId: string;
  quantity: number;
};

function normalizeTransferRequestItems(
  items: InventoryTransferRequestInput["items"]
): InventoryTransferRequestItemNormalized[] {
  const quantitiesByProduct = new Map<string, number>();

  for (const item of items) {
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity
    );
  }

  return [...quantitiesByProduct.entries()].map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}

async function resolveStorageWarehouseForTransfer(
  tx: Prisma.TransactionClient,
  warehouseId?: string | null
) {
  const warehouse = warehouseId
    ? await tx.warehouse.findUnique({
        where: {
          id: warehouseId
        },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true
        }
      })
    : await getOrCreateDefaultWarehouse(tx);

  if (!warehouse) {
    throw new AppError(404, "Almacén origen no encontrado");
  }

  if (!warehouse.isActive) {
    throw new AppError(400, `Almacén origen inactivo: ${warehouse.name}`);
  }

  if (warehouse.type !== WarehouseType.STORAGE) {
    throw new AppError(400, "El almacén origen debe ser un almacén operativo, no stock de vendedor.");
  }

  return warehouse;
}

export async function createInventoryTransferRequest(
  requestedBy: { id: string; role: Role },
  input: InventoryTransferRequestInput
) {
  if (requestedBy.role !== Role.CASHIER) {
    throw new AppError(400, "Solo vendedores pueden solicitar retiro de stock.");
  }

  const normalizedItems = normalizeTransferRequestItems(input.items);
  const reason = input.reason.trim();

  return runInventoryTransaction(async (tx) => {
    const fromWarehouse = await resolveStorageWarehouseForTransfer(
      tx,
      input.fromWarehouseId
    );
    const toWarehouse = await getOrCreateSellerWarehouse(tx, requestedBy.id);

    const requestItems: Prisma.InventoryTransferRequestItemCreateWithoutRequestInput[] = [];

    for (const item of normalizedItems) {
      const product = await assertActiveProduct(tx, item.productId);

      const pendingRequest = await tx.inventoryTransferRequestItem.findFirst({
        where: {
          productId: item.productId,
          request: {
            status: InventoryTransferRequestStatus.PENDING,
            requestedById: requestedBy.id,
            fromWarehouseId: fromWarehouse.id
          }
        },
        select: {
          requestId: true
        }
      });

      if (pendingRequest) {
        throw new AppError(
          409,
          `Ya existe una solicitud pendiente para ${product.name} desde ${fromWarehouse.name}.`
        );
      }

      const sourceBalance = await tx.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: fromWarehouse.id
          }
        },
        select: {
          quantity: true
        }
      });

      const available = sourceBalance?.quantity ?? 0;

      if (available < item.quantity) {
        throw new AppError(
          409,
          `Stock insuficiente para ${product.name}. Almacén: ${fromWarehouse.name}. Stock actual: ${available}.`
        );
      }

      requestItems.push({
        product: {
          connect: {
            id: product.id
          }
        },
        productSku: product.sku,
        productName: product.name,
        quantity: item.quantity
      });
    }

    return tx.inventoryTransferRequest.create({
      data: {
        fromWarehouse: {
          connect: {
            id: fromWarehouse.id
          }
        },
        toWarehouse: {
          connect: {
            id: toWarehouse.id
          }
        },
        requestedBy: {
          connect: {
            id: requestedBy.id
          }
        },
        reason,
        items: {
          create: requestItems
        }
      },
      include: inventoryTransferRequestInclude
    });
  });
}

export const inventoryTransferRequestInclude = {
  fromWarehouse: {
    select: {
      id: true,
      name: true,
      type: true,
      sellerId: true,
      isActive: true
    }
  },
  toWarehouse: {
    select: {
      id: true,
      name: true,
      type: true,
      sellerId: true,
      isActive: true
    }
  },
  requestedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  items: {
    orderBy: {
      productName: "asc"
    }
  }
} satisfies Prisma.InventoryTransferRequestInclude;

export type InventoryTransferRequestWithDetails = Prisma.InventoryTransferRequestGetPayload<{
  include: typeof inventoryTransferRequestInclude;
}>;


export async function approveInventoryTransferRequest(input: {
  requestId: string;
  reviewedById: string;
  reviewNote?: string | null;
}) {
  const reviewNote = input.reviewNote?.trim() || null;

  return runInventoryTransaction(async (tx) => {
    const request = await tx.inventoryTransferRequest.findUnique({
      where: {
        id: input.requestId
      },
      include: inventoryTransferRequestInclude
    });

    if (!request) {
      throw new AppError(404, "Solicitud de retiro no encontrada");
    }

    if (request.status !== InventoryTransferRequestStatus.PENDING) {
      throw new AppError(409, "Solo se pueden aprobar solicitudes pendientes.");
    }

    if (!request.fromWarehouse.isActive) {
      throw new AppError(400, `Almacén origen inactivo: ${request.fromWarehouse.name}`);
    }

    if (request.fromWarehouse.type !== WarehouseType.STORAGE) {
      throw new AppError(400, "El almacén origen debe ser un almacén operativo.");
    }

    if (!request.toWarehouse.isActive) {
      throw new AppError(400, `Almacén destino inactivo: ${request.toWarehouse.name}`);
    }

    if (request.toWarehouse.type !== WarehouseType.SELLER) {
      throw new AppError(400, "El almacén destino debe ser stock de vendedor.");
    }

    if (request.toWarehouse.sellerId !== request.requestedById) {
      throw new AppError(409, "La solicitud no apunta al stock del vendedor solicitante.");
    }

    for (const item of request.items) {
      if (!item.productId) {
        throw new AppError(
          409,
          `No se puede aprobar el retiro de ${item.productName} porque el producto ya no existe.`
        );
      }

      await decreaseStock(tx, {
        productId: item.productId,
        warehouseId: request.fromWarehouseId,
        quantity: item.quantity,
        reason: `Retiro aprobado para ${request.toWarehouse.name}`,
        type: InventoryType.OUT,
        createdBy: input.reviewedById,
        insufficientStockMessage: `Stock insuficiente para aprobar retiro de ${item.productName}.`
      });

      await increaseStock(tx, {
        productId: item.productId,
        warehouseId: request.toWarehouseId,
        quantity: item.quantity,
        reason: `Stock asignado desde ${request.fromWarehouse.name}`,
        type: InventoryType.IN,
        createdBy: input.reviewedById
      });
    }

    return tx.inventoryTransferRequest.update({
      where: {
        id: input.requestId
      },
      data: {
        status: InventoryTransferRequestStatus.APPROVED,
        reviewedBy: {
          connect: {
            id: input.reviewedById
          }
        },
        reviewNote,
        reviewedAt: new Date()
      },
      include: inventoryTransferRequestInclude
    });
  });
}

export async function rejectInventoryTransferRequest(input: {
  requestId: string;
  reviewedById: string;
  reviewNote: string;
}) {
  const reviewNote = input.reviewNote.trim();

  return runInventoryTransaction(async (tx) => {
    const request = await tx.inventoryTransferRequest.findUnique({
      where: {
        id: input.requestId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!request) {
      throw new AppError(404, "Solicitud de retiro no encontrada");
    }

    if (request.status !== InventoryTransferRequestStatus.PENDING) {
      throw new AppError(409, "Solo se pueden revisar solicitudes pendientes.");
    }

    return tx.inventoryTransferRequest.update({
      where: {
        id: input.requestId
      },
      data: {
        status: InventoryTransferRequestStatus.REJECTED,
        reviewedBy: {
          connect: {
            id: input.reviewedById
          }
        },
        reviewNote,
        reviewedAt: new Date()
      },
      include: inventoryTransferRequestInclude
    });
  });
}

export type ProductStockBreakdown = {
  total: number;
  locations: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseType: WarehouseType;
    sellerId: string | null;
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
      warehouseType: balance.warehouse.type,
      sellerId: balance.warehouse.sellerId,
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
  return runInventoryTransaction((tx) =>
    increaseStock(tx, {
      ...input,
      type: InventoryType.IN
    })
  );
}

export async function recordInventoryOut(input: Omit<StockMovementInput, "type">) {
  return runInventoryTransaction((tx) =>
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
      `${input.insufficientStockMessage ?? `Stock insuficiente para ${product.name}.`} Almacén: ${warehouse.name}. Stock actual: ${currentStock}.`
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
