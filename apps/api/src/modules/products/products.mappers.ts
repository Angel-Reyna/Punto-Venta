import { Prisma, Role } from "@prisma/client";

import { calculateFinalPrice, calculateMargin } from "./products.service";

export const productWithCategoryInclude = {
  category: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.ProductInclude;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productWithCategoryInclude;
}>;

export function mapProductForRole(
  product: ProductWithCategory,
  stock: number,
  role?: Role
) {
  const salePrice = Number(product.salePrice);
  const promoPercent = Number(product.promoPercent);
  const finalPrice = calculateFinalPrice(salePrice, promoPercent);

  if (role !== Role.ADMIN) {
    return {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      category: product.category,
      salePrice,
      promoPercent,
      finalPrice,
      stock
    };
  }

  return {
    ...product,
    costPrice: Number(product.costPrice),
    salePrice,
    promoPercent,
    marginPercent: calculateMargin(Number(product.costPrice), salePrice),
    finalPrice,
    stock
  };
}
