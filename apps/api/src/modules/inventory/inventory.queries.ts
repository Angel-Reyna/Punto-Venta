import { InventoryType, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import {
  buildPaginationMeta,
  getDateRange,
  getOptionalBoolean,
  getOptionalString,
  getPagination
} from "../../utils/pagination";

import {
  mapProductStock,
  productStockInclude
} from "./inventory.mappers";
import { getProductStocks } from "./inventory.service";
import {
  EXPIRATION_REASON_LABEL,
  INVENTORY_REASON_TYPES
} from "./inventory.shared";

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      name: "asc"
    }
  });
}

const EXPIRATION_SEARCH_TERMS = [
  EXPIRATION_REASON_LABEL,
  "merma",
  "merma economica",
  "expiration",
  "expired",
  "vencimiento",
  "vencido"
] as const;

function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .trim()
    .toLowerCase();
}

function matchesExpirationSearchTerm(q: string) {
  const normalizedQuery = normalizeSearchTerm(q);

  if (!normalizedQuery) {
    return false;
  }

  return EXPIRATION_SEARCH_TERMS.some((term) => {
    const normalizedTerm = normalizeSearchTerm(term);

    return (
      normalizedTerm.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedTerm)
    );
  });
}

function buildMovementSearchFilters(q: string): Prisma.InventoryMovementWhereInput[] {
  const filters: Prisma.InventoryMovementWhereInput[] = [
    {
      reason: {
        contains: q,
        mode: "insensitive"
      }
    },
    {
      productSku: {
        contains: q,
        mode: "insensitive"
      }
    },
    {
      productName: {
        contains: q,
        mode: "insensitive"
      }
    },
    {
      product: {
        barcode: {
          contains: q,
          mode: "insensitive"
        }
      }
    },
    {
      warehouse: {
        name: {
          contains: q,
          mode: "insensitive"
        }
      }
    }
  ];

  if (matchesExpirationSearchTerm(q)) {
    filters.push({
      reasonType: INVENTORY_REASON_TYPES.EXPIRATION
    });
  }

  return filters;
}

export async function listInventoryMovements(query: Record<string, unknown>) {
  const pagination = getPagination(query, {
    defaultPageSize: 50,
    maxPageSize: 100
  });
  const q = getOptionalString(query.q, 120);
  const productId = getOptionalString(query.productId, 80);
  const warehouseId = getOptionalString(query.warehouseId, 80);
  const type = getOptionalString(query.type, 30);
  const { dateFrom, dateTo } = getDateRange(query);

  if (type && !Object.values(InventoryType).includes(type as InventoryType)) {
    throw new AppError(400, "Tipo de movimiento inválido");
  }

  const where: Prisma.InventoryMovementWhereInput = {
    ...(productId ? { productId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(type ? { type: type as InventoryType } : {}),
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
          OR: buildMovementSearchFilters(q)
        }
      : {})
  };

  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            barcode: true,
            name: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: pagination.skip,
      take: pagination.take
    })
  ]);

  return {
    data: movements,
    meta: buildPaginationMeta(pagination, total)
  };
}

function buildStockWhere(query: Record<string, unknown>): Prisma.ProductWhereInput {
  const q = getOptionalString(query.q, 120);
  const categoryId = getOptionalString(query.categoryId, 80);

  return {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            {
              sku: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              name: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              barcode: {
                contains: q,
                mode: "insensitive"
              }
            },
            {
              category: {
                name: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            }
          ]
        }
      : {})
  };
}

export async function listProductStock(query: Record<string, unknown>) {
  const pagination = getPagination(query, {
    defaultPageSize: 50,
    maxPageSize: 100
  });
  const lowStock = getOptionalBoolean(query.lowStock);
  const where = buildStockWhere(query);

  if (lowStock !== true) {
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productStockInclude,
        orderBy: {
          name: "asc"
        },
        skip: pagination.skip,
        take: pagination.take
      })
    ]);

    const stocks = await getProductStocks(
      products.map((product) => product.id)
    );

    return {
      data: products.map((product) => mapProductStock(product, stocks)),
      meta: buildPaginationMeta(pagination, total)
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: productStockInclude,
    orderBy: {
      name: "asc"
    }
  });

  const stocks = await getProductStocks(products.map((product) => product.id));
  const lowStockProducts = products
    .map((product) => mapProductStock(product, stocks))
    .filter((product) => product.lowStock);

  const pageItems = lowStockProducts.slice(
    pagination.skip,
    pagination.skip + pagination.take
  );

  return {
    data: pageItems,
    meta: buildPaginationMeta(pagination, lowStockProducts.length)
  };
}
