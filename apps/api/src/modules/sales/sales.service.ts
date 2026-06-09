import { randomUUID } from "crypto";

import {
  PaymentMethod,
  Prisma,
  Role,
  SaleAdjustmentRequestStatus,
  SaleAdjustmentRequestType,
  SaleStatus,
  WarehouseType
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import {
  buildPaginationMeta,
  getDateRange,
  getOptionalString,
  getPagination
} from "../../utils/pagination";
import {
  decreaseStock,
  getOrCreateDefaultWarehouse
} from "../inventory/inventory.service";
import {
  createdSaleInclude,
  mapCreatedSale,
  mapSaleDetails,
  saleDetailsInclude,
  saleMutationInclude,
  type SaleForMutation,
  type SaleWithItemsAndPayments
} from "./sales.mappers";
import { restoreStockForExistingProducts } from "./sales.stock";
import type {
  CancelSaleInput,
  CreateSaleInput,
  CreateSalesAdjustmentRequestInput,
  ReturnSaleInput,
  ReviewSalesAdjustmentRequestInput
} from "./sales.schemas";

type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

type ClientMeta = {
  ipAddress?: string;
  userAgent?: string;
};

const salesAdjustmentRequestInclude = {
  sale: {
    select: {
      id: true,
      folio: true,
      status: true,
      total: true,
      createdAt: true,
      cashier: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
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
    include: {
      saleItem: {
        select: {
          id: true,
          quantity: true,
          productSku: true,
          productName: true
        }
      },
      product: {
        select: {
          id: true,
          sku: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.SaleAdjustmentRequestInclude;

type SalesAdjustmentRequestWithDetails = Prisma.SaleAdjustmentRequestGetPayload<{
  include: typeof salesAdjustmentRequestInclude;
}>;

type PreparedSaleItem = {
  product: {
    id: string;
    sku: string;
    name: string;
    costPrice: Prisma.Decimal;
    salePrice: Prisma.Decimal;
    promoPercent: Prisma.Decimal;
    isActive: boolean;
  };
  quantity: number;
  unitPrice: number;
  unitCost: number;
  promoPercent: number;
  discount: number;
  total: number;
  grossProfit: number;
};

type SaleItemForReturnSnapshot = SaleForMutation["items"][number];

type SaleForRemainingReturns = {
  items: SaleItemForReturnSnapshot[];
  returns: Array<{
    items: Array<{
      saleItemId: string;
      quantity: number;
    }>;
  }>;
};

function generateFolio() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  return `SALE-${yyyy}${mm}${dd}-${random}`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isUniqueConstraintError(error: unknown, field?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  if (!field) {
    return true;
  }

  const target = error.meta?.target;

  return Array.isArray(target) && target.includes(field);
}

function aggregateSaleItems(items: CreateSaleInput["items"]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity
    );
  }

  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}

function aggregateReturnItems(items: ReturnSaleInput["items"]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.saleItemId,
      (quantities.get(item.saleItemId) ?? 0) + item.quantity
    );
  }

  return [...quantities.entries()].map(([saleItemId, quantity]) => ({
    saleItemId,
    quantity
  }));
}

function aggregateAdjustmentRequestItems(
  items: CreateSalesAdjustmentRequestInput["items"] | undefined
) {
  if (!items) {
    return [];
  }

  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.saleItemId,
      (quantities.get(item.saleItemId) ?? 0) + item.quantity
    );
  }

  return [...quantities.entries()].map(([saleItemId, quantity]) => ({
    saleItemId,
    quantity
  }));
}

function getPendingAdjustmentQuantities(sale: SaleForAdjustmentRequest) {
  const quantities = new Map<string, number>();

  for (const request of sale.adjustmentRequests) {
    if (
      request.status !== SaleAdjustmentRequestStatus.PENDING ||
      request.type !== SaleAdjustmentRequestType.RETURN_ITEMS
    ) {
      continue;
    }

    for (const item of request.items) {
      quantities.set(
        item.saleItemId,
        (quantities.get(item.saleItemId) ?? 0) + item.quantity
      );
    }
  }

  return quantities;
}

function mapSalesAdjustmentRequest(request: SalesAdjustmentRequestWithDetails) {
  return {
    ...request,
    sale: {
      ...request.sale,
      total: Number(request.sale.total)
    },
    items: request.items.map((item) => ({
      ...item,
      product: item.product
        ? item.product
        : {
            id: item.productId,
            sku: item.productSku,
            name: `${item.productName} (eliminado)`,
            deleted: true
          }
    }))
  };
}

const saleForAdjustmentRequestInclude = {
  items: true,
  returns: {
    include: {
      items: true
    }
  },
  adjustmentRequests: {
    where: {
      status: SaleAdjustmentRequestStatus.PENDING
    },
    include: {
      items: true
    }
  }
} satisfies Prisma.SaleInclude;

type SaleForAdjustmentRequest = Prisma.SaleGetPayload<{
  include: typeof saleForAdjustmentRequestInclude;
}>;

function validateAdjustmentRequestSaleAccess(
  user: CurrentUser,
  sale: { cashierId: string }
) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (sale.cashierId !== user.id) {
    throw new AppError(403, "No autorizado");
  }
}


async function resolveSaleWarehouse(
  tx: Prisma.TransactionClient,
  user: CurrentUser,
  warehouseId?: string | null
) {
  const requestedWarehouseId = warehouseId?.trim() || null;

  if (!requestedWarehouseId && user.role === Role.CASHIER) {
    throw new AppError(
      400,
      "Selecciona tu stock asignado para registrar la venta. Si no tienes producto disponible, solicita retiro al administrador."
    );
  }

  if (requestedWarehouseId) {
    const warehouse = await tx.warehouse.findUnique({
      where: {
        id: requestedWarehouseId
      },
      select: {
        id: true,
        name: true,
        type: true,
        sellerId: true,
        isActive: true
      }
    });

    if (!warehouse) {
      throw new AppError(404, "Almacén de venta no encontrado");
    }

    if (!warehouse.isActive) {
      throw new AppError(400, `Almacén de venta inactivo: ${warehouse.name}`);
    }

    if (user.role === Role.CASHIER) {
      const isOwnSellerWarehouse =
        warehouse.type === WarehouseType.SELLER && warehouse.sellerId === user.id;

      if (!isOwnSellerWarehouse) {
        throw new AppError(403, "Solo puedes vender desde tu stock asignado.");
      }
    }

    return warehouse;
  }

  return getOrCreateDefaultWarehouse(tx);
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  customerId?: string | null,
  customerName?: string | null
) {
  if (customerId) {
    const customer = await tx.customer.findUnique({
      where: {
        id: customerId
      }
    });

    if (!customer) {
      throw new AppError(404, "Cliente no encontrado");
    }

    if (!customer.isActive) {
      throw new AppError(400, "Cliente inactivo");
    }

    return customer.id;
  }

  const cleanName = customerName?.trim();

  if (!cleanName) {
    return null;
  }

  const customer = await tx.customer.create({
    data: {
      name: cleanName,
      isActive: true
    }
  });

  return customer.id;
}

async function prepareSaleItems(
  tx: Prisma.TransactionClient,
  items: CreateSaleInput["items"]
) {
  const aggregatedItems = aggregateSaleItems(items);
  const preparedItems: PreparedSaleItem[] = [];
  let subtotal = 0;
  let discount = 0;

  for (const item of aggregatedItems) {
    const product = await tx.product.findUnique({
      where: {
        id: item.productId
      },
      select: {
        id: true,
        sku: true,
        name: true,
        costPrice: true,
        salePrice: true,
        promoPercent: true,
        isActive: true
      }
    });

    if (!product) {
      throw new AppError(404, "Producto no encontrado");
    }

    if (!product.isActive) {
      throw new AppError(400, `Producto inactivo: ${product.name}`);
    }

    const unitPrice = Number(product.salePrice);
    const unitCost = Number(product.costPrice);
    const promoPercent = Number(product.promoPercent);
    const lineSubtotal = roundMoney(unitPrice * item.quantity);
    const lineDiscount = roundMoney(lineSubtotal * (promoPercent / 100));
    const lineTotal = roundMoney(lineSubtotal - lineDiscount);
    const lineCost = roundMoney(unitCost * item.quantity);
    const lineGrossProfit = roundMoney(lineTotal - lineCost);

    subtotal = roundMoney(subtotal + lineSubtotal);
    discount = roundMoney(discount + lineDiscount);

    preparedItems.push({
      product,
      quantity: item.quantity,
      unitPrice,
      unitCost,
      promoPercent,
      discount: lineDiscount,
      total: lineTotal,
      grossProfit: lineGrossProfit
    });
  }

  return {
    preparedItems,
    subtotal,
    discount,
    total: roundMoney(subtotal - discount)
  };
}

function assertAdmin(user: CurrentUser) {
  if (user.role !== Role.ADMIN) {
    throw new AppError(403, "Solo un administrador puede realizar esta operación");
  }
}

function resolveRefundMethod(
  requestedMethod: PaymentMethod | undefined,
  payments: SaleForMutation["payments"]
) {
  if (requestedMethod) {
    return requestedMethod;
  }

  const hasCash = payments.some((payment) => payment.method === PaymentMethod.CASH);

  if (hasCash) {
    return PaymentMethod.CASH;
  }

  return payments[0]?.method ?? PaymentMethod.CASH;
}

function getReturnedQuantities(sale: {
  returns: Array<{
    items: Array<{
      saleItemId: string;
      quantity: number;
    }>;
  }>;
}) {
  const returnedQuantities = new Map<string, number>();

  for (const saleReturn of sale.returns) {
    for (const item of saleReturn.items) {
      returnedQuantities.set(
        item.saleItemId,
        (returnedQuantities.get(item.saleItemId) ?? 0) + item.quantity
      );
    }
  }

  return returnedQuantities;
}

function computeNextReturnStatus(
  sale: SaleForMutation,
  newReturnQuantities: Map<string, number>
) {
  const previouslyReturned = getReturnedQuantities(sale);

  const allReturned = sale.items.every((item) => {
    const totalReturned =
      (previouslyReturned.get(item.id) ?? 0) +
      (newReturnQuantities.get(item.id) ?? 0);

    return totalReturned >= item.quantity;
  });

  return allReturned ? SaleStatus.REFUNDED : SaleStatus.PARTIALLY_REFUNDED;
}

function buildRemainingReturnItems(sale: SaleForRemainingReturns) {
  const previouslyReturned = getReturnedQuantities(sale);

  return sale.items
    .map((saleItem) => ({
      saleItem,
      quantity: saleItem.quantity - (previouslyReturned.get(saleItem.id) ?? 0)
    }))
    .filter((item) => item.quantity > 0);
}

function buildReturnItemSnapshot(
  saleItem: SaleItemForReturnSnapshot,
  quantity: number
) {
  const unitPrice = Number(saleItem.unitPrice);
  const unitCost = Number(saleItem.unitCost ?? 0);
  const promoPercent = Number(saleItem.promoPercent ?? 0);
  const unitDiscount = roundMoney(Number(saleItem.discount) / saleItem.quantity);
  const unitTotal = roundMoney(Number(saleItem.total) / saleItem.quantity);
  const unitGrossProfit = roundMoney(Number(saleItem.grossProfit ?? 0) / saleItem.quantity);

  return {
    saleItem,
    quantity,
    unitPrice,
    unitCost,
    promoPercent,
    discount: roundMoney(unitDiscount * quantity),
    total: roundMoney(unitTotal * quantity),
    grossProfit: roundMoney(unitGrossProfit * quantity)
  };
}

export async function listSales(
  user: CurrentUser,
  query: Record<string, unknown>
) {
  const pagination = getPagination(query, {
    defaultPageSize: 50,
    maxPageSize: 100
  });
  const q = getOptionalString(query.q, 120);
  const cashierId = getOptionalString(query.cashierId, 80);
  const customerId = getOptionalString(query.customerId, 80);
  const status = getOptionalString(query.status, 30);
  const paymentMethod = getOptionalString(query.paymentMethod, 30);
  const { dateFrom, dateTo } = getDateRange(query);

  if (status && !Object.values(SaleStatus).includes(status as SaleStatus)) {
    throw new AppError(400, "status inválido");
  }

  if (
    paymentMethod &&
    !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)
  ) {
    throw new AppError(400, "paymentMethod inválido");
  }

  const where: Prisma.SaleWhereInput = {
    ...(user.role === Role.ADMIN
      ? cashierId
        ? {
            cashierId
          }
        : {}
      : {
          cashierId: user.id
        }),
    ...(customerId
      ? {
          customerId
        }
      : {}),
    ...(status
      ? {
          status: status as SaleStatus
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {})
          }
        }
      : {}),
    ...(q
      ? {
          OR: [
            {
              folio: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              customer: {
                name: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            },
            ...(user.role === Role.ADMIN
              ? [
                  {
                    cashier: {
                      name: {
                        contains: q,
                        mode: "insensitive" as const
                      }
                    }
                  }
                ]
              : [])
          ]
        }
      : {}),
    ...(paymentMethod
      ? {
          payments: {
            some: {
              method: paymentMethod as PaymentMethod
            }
          }
        }
      : {})
  };

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: saleDetailsInclude,
      orderBy: {
        createdAt: "desc"
      },
      skip: pagination.skip,
      take: pagination.take
    })
  ]);

  return {
    data: sales.map(mapSaleDetails),
    meta: buildPaginationMeta(pagination, total)
  };
}

export async function getSaleById(user: CurrentUser, id: string) {
  const sale = await prisma.sale.findUnique({
    where: {
      id
    },
    include: saleDetailsInclude
  });

  if (!sale) {
    throw new AppError(404, "Venta no encontrada");
  }

  const isOwner = sale.cashierId === user.id;
  const isAdmin = user.role === Role.ADMIN;

  if (!isAdmin && !isOwner) {
    throw new AppError(403, "No autorizado");
  }

  return mapSaleDetails(sale);
}

export async function listSalesAdjustmentRequests(
  user: CurrentUser,
  query: Record<string, unknown>
) {
  const pagination = getPagination(query, {
    defaultPageSize: 25,
    maxPageSize: 100
  });

  const status = getOptionalString(query.status, 40);
  const type = getOptionalString(query.type, 40);
  const saleId = getOptionalString(query.saleId, 80);

  if (
    status &&
    !Object.values(SaleAdjustmentRequestStatus).includes(
      status as SaleAdjustmentRequestStatus
    )
  ) {
    throw new AppError(400, "status inválido");
  }

  if (
    type &&
    !Object.values(SaleAdjustmentRequestType).includes(
      type as SaleAdjustmentRequestType
    )
  ) {
    throw new AppError(400, "type inválido");
  }

  const where: Prisma.SaleAdjustmentRequestWhereInput = {
    ...(user.role === Role.ADMIN
      ? {}
      : {
          requestedById: user.id
        }),
    ...(status
      ? {
          status: status as SaleAdjustmentRequestStatus
        }
      : {}),
    ...(type
      ? {
          type: type as SaleAdjustmentRequestType
        }
      : {}),
    ...(saleId
      ? {
          saleId
        }
      : {})
  };

  const [total, requests] = await Promise.all([
    prisma.saleAdjustmentRequest.count({ where }),
    prisma.saleAdjustmentRequest.findMany({
      where,
      include: salesAdjustmentRequestInclude,
      orderBy: {
        createdAt: "desc"
      },
      skip: pagination.skip,
      take: pagination.take
    })
  ]);

  return {
    data: requests.map(mapSalesAdjustmentRequest),
    meta: buildPaginationMeta(pagination, total)
  };
}

export async function createSalesAdjustmentRequest(
  user: CurrentUser,
  saleId: string,
  input: CreateSalesAdjustmentRequestInput
) {
  return prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.findUnique({
        where: {
          id: saleId
        },
        include: saleForAdjustmentRequestInclude
      });

      if (!sale) {
        throw new AppError(404, "Venta no encontrada");
      }

      validateAdjustmentRequestSaleAccess(user, sale);

      if (sale.status === SaleStatus.CANCELLED) {
        throw new AppError(409, "No se pueden solicitar ajustes de una venta cancelada");
      }

      if (sale.adjustmentRequests.length > 0) {
        throw new AppError(409, "Ya existe una solicitud pendiente para esta venta");
      }

      const requestedItems = aggregateAdjustmentRequestItems(input.items);
      const itemById = new Map(sale.items.map((item) => [item.id, item]));

      if (input.type === SaleAdjustmentRequestType.CANCEL_SALE) {
        const canRequestSaleClosure =
          sale.status === SaleStatus.COMPLETED ||
          (sale.status === SaleStatus.PARTIALLY_REFUNDED &&
            buildRemainingReturnItems(sale).length > 0);

        if (!canRequestSaleClosure) {
          throw new AppError(
            409,
            "Solo se puede solicitar cancelación o devolución restante de ventas con unidades pendientes"
          );
        }
      }

      const previouslyReturned = getReturnedQuantities(sale);
      const pendingAdjustmentQuantities = getPendingAdjustmentQuantities(sale);

      const requestItems = requestedItems.map((requestedItem) => {
        const saleItem = itemById.get(requestedItem.saleItemId);

        if (!saleItem) {
          throw new AppError(400, "La partida no pertenece a la venta");
        }

        const alreadyReturned = previouslyReturned.get(saleItem.id) ?? 0;
        const pendingQuantity = pendingAdjustmentQuantities.get(saleItem.id) ?? 0;
        const availableToRequest = saleItem.quantity - alreadyReturned - pendingQuantity;

        if (requestedItem.quantity > availableToRequest) {
          throw new AppError(
            409,
            `Cantidad a solicitar inválida. Disponible para solicitar: ${availableToRequest}.`
          );
        }

        return {
          saleItemId: saleItem.id,
          productId: saleItem.productId,
          productSku: saleItem.productSku,
          productName: saleItem.productName,
          quantity: requestedItem.quantity
        };
      });

      const request = await tx.saleAdjustmentRequest.create({
        data: {
          type: input.type,
          status: SaleAdjustmentRequestStatus.PENDING,
          saleId: sale.id,
          requestedById: user.id,
          reason: input.reason,
          refundMethod: input.refundMethod,
          items: requestItems.length
            ? {
                create: requestItems
              }
            : undefined
        },
        include: salesAdjustmentRequestInclude
      });

      return mapSalesAdjustmentRequest(request);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}

export async function rejectSalesAdjustmentRequest(
  user: CurrentUser,
  requestId: string,
  input: ReviewSalesAdjustmentRequestInput
) {
  assertAdmin(user);

  const request = await prisma.saleAdjustmentRequest.findUnique({
    where: {
      id: requestId
    }
  });

  if (!request) {
    throw new AppError(404, "Solicitud no encontrada");
  }

  if (request.status !== SaleAdjustmentRequestStatus.PENDING) {
    throw new AppError(409, "La solicitud ya fue revisada");
  }

  const updatedRequest = await prisma.saleAdjustmentRequest.update({
    where: {
      id: request.id
    },
    data: {
      status: SaleAdjustmentRequestStatus.REJECTED,
      reviewedById: user.id,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote
    },
    include: salesAdjustmentRequestInclude
  });

  return mapSalesAdjustmentRequest(updatedRequest);
}


async function createSaleAttempt(
  user: CurrentUser,
  input: CreateSaleInput,
  clientMeta: ClientMeta
) {
  return prisma.$transaction(
    async (tx): Promise<SaleWithItemsAndPayments> => {
      const warehouse = await resolveSaleWarehouse(tx, user, input.warehouseId);
      const customerId = await resolveCustomer(
        tx,
        input.customerId,
        input.customerName
      );
      const { preparedItems, subtotal, discount, total } = await prepareSaleItems(
        tx,
        input.items
      );

      const paidAmount =
        input.paidAmount === undefined ? total : roundMoney(input.paidAmount);

      if (paidAmount < total) {
        throw new AppError(
          400,
          `Pago insuficiente. Total: $${total.toFixed(2)}, recibido: $${paidAmount.toFixed(2)}.`
        );
      }

      const createdSale = await tx.sale.create({
        data: {
          folio: generateFolio(),
          cashierId: user.id,
          customerId,
          warehouseId: warehouse.id,
          status: SaleStatus.COMPLETED,
          subtotal,
          discount,
          tax: 0,
          total,
          items: {
            create: preparedItems.map((item) => ({
              productId: item.product.id,
              productSku: item.product.sku,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              promoPercent: item.promoPercent,
              discount: item.discount,
              total: item.total,
              grossProfit: item.grossProfit
            }))
          },
          payments: {
            create: {
              method: input.paymentMethod,
              amount: total
            }
          }
        },
        include: createdSaleInclude
      });

      for (const item of preparedItems) {
        await decreaseStock(tx, {
          productId: item.product.id,
          warehouseId: warehouse.id,
          type: "SALE",
          quantity: item.quantity,
          reason: `Venta ${createdSale.folio}`,
          createdBy: user.id,
          insufficientStockMessage: `Stock insuficiente para ${item.product.name}.`
        });
      }

      if (user.role === Role.CASHIER) {
        await tx.sellerActivityLog.create({
          data: {
            sellerId: user.id,
            action: "SALE_CREATED",
            entityType: "Sale",
            entityId: createdSale.id,
            description: `Venta creada con folio ${createdSale.folio}`,
            metadata: {
              folio: createdSale.folio,
              total,
              items: preparedItems.length
            },
            ipAddress: clientMeta.ipAddress,
            userAgent: clientMeta.userAgent
          }
        });
      }

      return createdSale;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}

export async function createSale(
  user: CurrentUser,
  input: CreateSaleInput,
  clientMeta: ClientMeta
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const sale = await createSaleAttempt(user, input, clientMeta);

      return mapCreatedSale(sale);
    } catch (error) {
      if (attempt < maxAttempts && isUniqueConstraintError(error, "folio")) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(500, "No se pudo generar el folio de venta");
}

async function executeCancelSale(
  tx: Prisma.TransactionClient,
  user: CurrentUser,
  saleId: string,
  input: CancelSaleInput
) {
  const sale = await tx.sale.findUnique({
    where: {
      id: saleId
    },
    include: saleMutationInclude
  });

  if (!sale) {
    throw new AppError(404, "Venta no encontrada");
  }

  if (sale.status === SaleStatus.CANCELLED) {
    throw new AppError(409, "La venta ya está cancelada");
  }

  if (sale.status === SaleStatus.REFUNDED) {
    throw new AppError(409, "La venta ya fue devuelta por completo");
  }

  if (
    sale.status !== SaleStatus.COMPLETED &&
    sale.status !== SaleStatus.PARTIALLY_REFUNDED
  ) {
    throw new AppError(
      409,
      "Solo se pueden cerrar ventas completadas o con devolución parcial"
    );
  }

  const remainingItems = buildRemainingReturnItems(sale);

  if (remainingItems.length === 0) {
    throw new AppError(409, "La venta no tiene productos pendientes por devolver");
  }

  const returnItems = remainingItems.map((item) =>
    buildReturnItemSnapshot(item.saleItem, item.quantity)
  );
  const refundTotal = roundMoney(
    returnItems.reduce((sum, item) => sum + item.total, 0)
  );
  const isFullCancellation = sale.status === SaleStatus.COMPLETED;
  const operationLabel = isFullCancellation ? "Cancelación" : "Devolución restante";

  await restoreStockForExistingProducts(
    tx,
    returnItems.map((item) => ({
      productId: item.saleItem.productId,
      quantity: item.quantity
    })),
    {
      reason: `${operationLabel} de venta ${sale.folio}: ${input.reason}`,
      createdBy: user.id,
      warehouseId: sale.warehouseId
    }
  );

  const refundMethod = resolveRefundMethod(input.refundMethod, sale.payments);

  await tx.saleReturn.create({
    data: {
      saleId: sale.id,
      cashierId: sale.cashierId,
      reason: input.reason,
      refundMethod,
      refundTotal,
      items: {
        create: returnItems.map((item) => ({
          saleItemId: item.saleItem.id,
          productId: item.saleItem.productId,
          productSku: item.saleItem.productSku,
          productName: item.saleItem.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          promoPercent: item.promoPercent,
          discount: item.discount,
          total: item.total,
          grossProfit: item.grossProfit
        }))
      }
    }
  });

  const updatedSale = await tx.sale.update({
    where: {
      id: sale.id
    },
    data: {
      status: isFullCancellation ? SaleStatus.CANCELLED : SaleStatus.REFUNDED
    },
    include: saleDetailsInclude
  });

  return mapSaleDetails(updatedSale);
}

async function executeReturnSaleItems(
  tx: Prisma.TransactionClient,
  user: CurrentUser,
  saleId: string,
  input: ReturnSaleInput
) {
  const sale = await tx.sale.findUnique({
    where: {
      id: saleId
    },
    include: saleMutationInclude
  });

  if (!sale) {
    throw new AppError(404, "Venta no encontrada");
  }

  if (sale.status === SaleStatus.CANCELLED) {
    throw new AppError(409, "No se pueden devolver productos de una venta cancelada");
  }

  if (sale.status === SaleStatus.REFUNDED) {
    throw new AppError(409, "La venta ya fue devuelta por completo");
  }

  const itemById = new Map(sale.items.map((item) => [item.id, item]));
  const previouslyReturned = getReturnedQuantities(sale);
  const requestedItems = aggregateReturnItems(input.items);
  const requestedQuantities = new Map<string, number>();
  let refundTotal = 0;

  const returnItems = requestedItems.map((requestedItem) => {
    const saleItem = itemById.get(requestedItem.saleItemId);

    if (!saleItem) {
      throw new AppError(400, "La partida no pertenece a la venta");
    }

    const alreadyReturned = previouslyReturned.get(saleItem.id) ?? 0;
    const availableToReturn = saleItem.quantity - alreadyReturned;

    if (requestedItem.quantity > availableToReturn) {
      throw new AppError(
        409,
        `Cantidad a devolver inválida. Disponible para devolver: ${availableToReturn}.`
      );
    }

    const returnItem = buildReturnItemSnapshot(saleItem, requestedItem.quantity);

    refundTotal = roundMoney(refundTotal + returnItem.total);
    requestedQuantities.set(saleItem.id, requestedItem.quantity);

    return returnItem;
  });

  await restoreStockForExistingProducts(
    tx,
    returnItems.map((item) => ({
      productId: item.saleItem.productId,
      quantity: item.quantity
    })),
    {
      reason: `Devolución de venta ${sale.folio}: ${input.reason}`,
      createdBy: user.id,
      warehouseId: sale.warehouseId
    }
  );

  const refundMethod = resolveRefundMethod(input.refundMethod, sale.payments);

  await tx.saleReturn.create({
    data: {
      saleId: sale.id,
      cashierId: sale.cashierId,
      reason: input.reason,
      refundMethod,
      refundTotal,
      items: {
        create: returnItems.map((item) => ({
          saleItemId: item.saleItem.id,
          productId: item.saleItem.productId,
          productSku: item.saleItem.productSku,
          productName: item.saleItem.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          promoPercent: item.promoPercent,
          discount: item.discount,
          total: item.total,
          grossProfit: item.grossProfit
        }))
      }
    }
  });

  const nextStatus = computeNextReturnStatus(sale, requestedQuantities);

  const updatedSale = await tx.sale.update({
    where: {
      id: sale.id
    },
    data: {
      status: nextStatus
    },
    include: saleDetailsInclude
  });

  return mapSaleDetails(updatedSale);
}

export async function approveSalesAdjustmentRequest(
  user: CurrentUser,
  requestId: string,
  input: ReviewSalesAdjustmentRequestInput
) {
  assertAdmin(user);

  return prisma.$transaction(
    async (tx) => {
      const request = await tx.saleAdjustmentRequest.findUnique({
        where: {
          id: requestId
        },
        include: {
          items: true
        }
      });

      if (!request) {
        throw new AppError(404, "Solicitud no encontrada");
      }

      if (request.status !== SaleAdjustmentRequestStatus.PENDING) {
        throw new AppError(409, "La solicitud ya fue revisada");
      }

      if (request.type === SaleAdjustmentRequestType.CANCEL_SALE) {
        await executeCancelSale(tx, user, request.saleId, {
          reason: request.reason,
          refundMethod: request.refundMethod ?? undefined
        });
      } else {
        if (request.items.length === 0) {
          throw new AppError(409, "La solicitud de devolución no tiene productos para aprobar");
        }

        await executeReturnSaleItems(tx, user, request.saleId, {
          reason: request.reason,
          refundMethod: request.refundMethod ?? undefined,
          items: request.items.map((item) => ({
            saleItemId: item.saleItemId,
            quantity: item.quantity
          }))
        });
      }

      const updatedRequest = await tx.saleAdjustmentRequest.update({
        where: {
          id: request.id
        },
        data: {
          status: SaleAdjustmentRequestStatus.APPROVED,
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote
        },
        include: salesAdjustmentRequestInclude
      });

      return mapSalesAdjustmentRequest(updatedRequest);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}

export async function cancelSale(
  user: CurrentUser,
  saleId: string,
  input: CancelSaleInput
) {
  assertAdmin(user);

  return prisma.$transaction(
    async (tx) => executeCancelSale(tx, user, saleId, input),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}

export async function returnSaleItems(
  user: CurrentUser,
  saleId: string,
  input: ReturnSaleInput
) {
  assertAdmin(user);

  return prisma.$transaction(
    async (tx) => executeReturnSaleItems(tx, user, saleId, input),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}
