import { Prisma, Role } from "@prisma/client";

import { prisma } from "../../config/prisma";
import {
  buildPaginationMeta,
  getOptionalBoolean,
  getOptionalString,
  getPagination
} from "../../utils/pagination";
import { getProductStocks } from "../inventory/inventory.service";

import { resolveProductCategorySelection } from "./products.categories";

import {
  mapProductForRole,
  productWithCategoryInclude,
  type ProductWithCategory
} from "./products.mappers";

export type ProductListUser = {
  role: Role;
};

function buildProductListWhere(
  user: ProductListUser,
  query: Record<string, unknown>
): Prisma.ProductWhereInput {
  const q = getOptionalString(query.q, 120);
  const categoryId = getOptionalString(query.categoryId, 80);
  const active = getOptionalBoolean(query.active);

  return {
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
              description: {
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
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(user.role === Role.ADMIN
      ? active === undefined
        ? {}
        : { isActive: active }
      : {
          isActive: true
        })
  };
}

function mapProductsWithStock(
  products: ProductWithCategory[],
  stocks: Map<string, number>,
  role?: Role
) {
  return products.map((product) =>
    mapProductForRole(product, stocks.get(product.id) ?? 0, role)
  );
}

export async function listProducts(
  user: ProductListUser,
  query: Record<string, unknown>
) {
  const pagination = getPagination(query, {
    defaultPageSize: 50,
    maxPageSize: 100
  });
  const lowStock = getOptionalBoolean(query.lowStock);
  const where = buildProductListWhere(user, query);

  if (lowStock !== true) {
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productWithCategoryInclude,
        orderBy: {
          createdAt: "desc"
        },
        skip: pagination.skip,
        take: pagination.take
      })
    ]);

    const stocks = await getProductStocks(
      products.map((product) => product.id)
    );

    return {
      data: mapProductsWithStock(products, stocks, user.role),
      meta: buildPaginationMeta(pagination, total)
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: productWithCategoryInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  const stocks = await getProductStocks(products.map((product) => product.id));
  const lowStockProducts = products.filter((product) => {
    const stock = stocks.get(product.id) ?? 0;

    return stock <= product.minStock;
  });

  const pageItems = lowStockProducts.slice(
    pagination.skip,
    pagination.skip + pagination.take
  );

  return {
    data: mapProductsWithStock(pageItems, stocks, user.role),
    meta: buildPaginationMeta(pagination, lowStockProducts.length)
  };
}

export async function listProductCategories() {
  return prisma.productCategory.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });
}

export type ProductUpdateInput = Prisma.ProductUpdateInput & {
  categoryId?: string | null;
  categoryName?: string | null;
};

export async function updateProduct(
  productId: string,
  data: ProductUpdateInput
) {
  return prisma.$transaction(async (tx) => {
    const oldData = await tx.product.findUniqueOrThrow({
      where: {
        id: productId
      }
    });

    const { categoryId, categoryName, ...productData } = data;
    const resolvedCategoryId = await resolveProductCategorySelection(
      tx,
      { categoryId, categoryName },
      { defaultToNull: false }
    );

    const updateData: Prisma.ProductUpdateInput = {
      ...productData
    };

    if (resolvedCategoryId !== undefined) {
      updateData.category = resolvedCategoryId
        ? {
            connect: {
              id: resolvedCategoryId
            }
          }
        : {
            disconnect: true
          };
    }

    const product = await tx.product.update({
      where: {
        id: productId
      },
      data: updateData
    });

    return {
      oldData,
      product
    };
  });
}

export async function toggleProductActive(productId: string) {
  const oldData = await prisma.product.findUniqueOrThrow({
    where: {
      id: productId
    }
  });

  const product = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      isActive: !oldData.isActive
    }
  });

  return {
    oldData,
    product
  };
}
