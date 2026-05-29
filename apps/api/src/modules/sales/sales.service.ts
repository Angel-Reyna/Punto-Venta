import { randomUUID } from "crypto";

import { PaymentMethod, Prisma, Role, SaleStatus } from "@prisma/client";
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
  tryRecordReturnCashMovement,
  tryRecordSaleCashMovement
} from "../cash-register/cash-register.service";
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
  ReturnSaleInput
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

function hasCashRefund(refundMethod: PaymentMethod) {
  return refundMethod === PaymentMethod.CASH;
}

function getReturnedQuantities(sale: SaleForMutation) {
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

async function createSaleAttempt(
  user: CurrentUser,
  input: CreateSaleInput,
  clientMeta: ClientMeta
) {
  return prisma.$transaction(
    async (tx): Promise<SaleWithItemsAndPayments> => {
      const warehouse = await getOrCreateDefaultWarehouse(tx);
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

      if (input.paymentMethod === PaymentMethod.CASH) {
        await tryRecordSaleCashMovement(tx, {
          cashierId: user.id,
          saleId: createdSale.id,
          amount: total,
          reason: `Venta en efectivo ${createdSale.folio}`
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

export async function cancelSale(
  user: CurrentUser,
  saleId: string,
  input: CancelSaleInput
) {
  assertAdmin(user);

  return prisma.$transaction(
    async (tx) => {
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

      if (sale.status !== SaleStatus.COMPLETED) {
        throw new AppError(409, "Solo se pueden cancelar ventas completadas sin devoluciones");
      }

      await restoreStockForExistingProducts(tx, sale.items, {
        reason: `Cancelación de venta ${sale.folio}: ${input.reason}`,
        createdBy: user.id
      });

      const refundMethod = resolveRefundMethod(input.refundMethod, sale.payments);

      const saleReturn = await tx.saleReturn.create({
        data: {
          saleId: sale.id,
          cashierId: user.id,
          reason: input.reason,
          refundMethod,
          refundTotal: Number(sale.total),
          items: {
            create: sale.items.map((item) => ({
              saleItemId: item.id,
              productId: item.productId,
              productSku: item.productSku,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              unitCost: Number(item.unitCost ?? 0),
              promoPercent: Number(item.promoPercent ?? 0),
              discount: Number(item.discount),
              total: Number(item.total),
              grossProfit: Number(item.grossProfit ?? 0)
            }))
          }
        }
      });

      if (hasCashRefund(refundMethod)) {
        await tryRecordReturnCashMovement(tx, {
          cashierId: user.id,
          saleReturnId: saleReturn.id,
          amount: Number(sale.total),
          reason: `Devolución por cancelación ${sale.folio}`
        });
      }

      const updatedSale = await tx.sale.update({
        where: {
          id: sale.id
        },
        data: {
          status: SaleStatus.CANCELLED
        },
        include: saleDetailsInclude
      });

      return mapSaleDetails(updatedSale);
    },
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
    async (tx) => {
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

        const unitPrice = Number(saleItem.unitPrice);
        const unitCost = Number(saleItem.unitCost ?? 0);
        const promoPercent = Number(saleItem.promoPercent ?? 0);
        const unitDiscount = roundMoney(Number(saleItem.discount) / saleItem.quantity);
        const unitTotal = roundMoney(Number(saleItem.total) / saleItem.quantity);
        const unitGrossProfit = roundMoney(Number(saleItem.grossProfit ?? 0) / saleItem.quantity);
        const lineDiscount = roundMoney(unitDiscount * requestedItem.quantity);
        const lineTotal = roundMoney(unitTotal * requestedItem.quantity);
        const lineGrossProfit = roundMoney(unitGrossProfit * requestedItem.quantity);

        refundTotal = roundMoney(refundTotal + lineTotal);
        requestedQuantities.set(saleItem.id, requestedItem.quantity);

        return {
          saleItem,
          quantity: requestedItem.quantity,
          unitPrice,
          unitCost,
          promoPercent,
          discount: lineDiscount,
          total: lineTotal,
          grossProfit: lineGrossProfit
        };
      });

      await restoreStockForExistingProducts(
        tx,
        returnItems.map((item) => ({
          productId: item.saleItem.productId,
          quantity: item.quantity
        })),
        {
          reason: `Devolución de venta ${sale.folio}: ${input.reason}`,
          createdBy: user.id
        }
      );

      const refundMethod = resolveRefundMethod(input.refundMethod, sale.payments);

      const saleReturn = await tx.saleReturn.create({
        data: {
          saleId: sale.id,
          cashierId: user.id,
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

      if (hasCashRefund(refundMethod)) {
        await tryRecordReturnCashMovement(tx, {
          cashierId: user.id,
          saleReturnId: saleReturn.id,
          amount: refundTotal,
          reason: `Devolución parcial ${sale.folio}`
        });
      }

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
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}
