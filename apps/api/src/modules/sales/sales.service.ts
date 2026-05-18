import { randomUUID } from "crypto";

import { PaymentMethod, Prisma, Role } from "@prisma/client";
import { z } from "zod";

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

export const saleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional().nullable(),
    customerName: z.string().trim().max(120).optional().nullable(),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().positive().max(1_000_000)
        })
      )
      .min(1)
      .max(200)
  })
});

export type CreateSaleInput = z.infer<typeof saleSchema>["body"];

type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

type ClientMeta = {
  ipAddress?: string;
  userAgent?: string;
};

const saleDetailsInclude = {
  cashier: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true
    }
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          salePrice: true,
          promoPercent: true
        }
      }
    }
  },
  payments: true
} satisfies Prisma.SaleInclude;

const createdSaleInclude = {
  items: true,
  payments: true
} satisfies Prisma.SaleInclude;

type SaleWithDetails = Prisma.SaleGetPayload<{
  include: typeof saleDetailsInclude;
}>;

type SaleWithItemsAndPayments = Prisma.SaleGetPayload<{
  include: typeof createdSaleInclude;
}>;

type PreparedSaleItem = {
  product: {
    id: string;
    name: string;
    salePrice: Prisma.Decimal;
    promoPercent: Prisma.Decimal;
    isActive: boolean;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
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
        name: true,
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
    const promoPercent = Number(product.promoPercent);
    const lineSubtotal = roundMoney(unitPrice * item.quantity);
    const lineDiscount = roundMoney(lineSubtotal * (promoPercent / 100));
    const lineTotal = roundMoney(lineSubtotal - lineDiscount);

    subtotal = roundMoney(subtotal + lineSubtotal);
    discount = roundMoney(discount + lineDiscount);

    preparedItems.push({
      product,
      quantity: item.quantity,
      unitPrice,
      discount: lineDiscount,
      total: lineTotal
    });
  }

  return {
    preparedItems,
    subtotal,
    discount,
    total: roundMoney(subtotal - discount)
  };
}

function mapSaleDetails(sale: SaleWithDetails) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      total: Number(item.total),
      product: {
        ...item.product,
        salePrice: Number(item.product.salePrice),
        promoPercent: Number(item.product.promoPercent)
      }
    })),
    payments: sale.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  };
}

function mapCreatedSale(sale: SaleWithItemsAndPayments) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      total: Number(item.total)
    })),
    payments: sale.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount)
    }))
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

  if (status && !["COMPLETED", "CANCELLED", "REFUNDED"].includes(status)) {
    throw new AppError(400, "status inválido");
  }

  if (
    paymentMethod &&
    !["CASH", "CARD", "TRANSFER", "MIXED"].includes(paymentMethod)
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
          status: status as "COMPLETED" | "CANCELLED" | "REFUNDED"
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

      const createdSale = await tx.sale.create({
        data: {
          folio: generateFolio(),
          cashierId: user.id,
          customerId,
          status: "COMPLETED",
          subtotal,
          discount,
          tax: 0,
          total,
          items: {
            create: preparedItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total
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
