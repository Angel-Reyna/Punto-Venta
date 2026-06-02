import { Prisma } from "@prisma/client";

import { AppError } from "../../utils/AppError";

export type ProductCategorySelectionInput = {
  categoryId?: string | null;
  categoryName?: string | null;
};

export type ProductCategorySelectionOptions = {
  defaultToNull: boolean;
};

function hasOwn(input: ProductCategorySelectionInput, key: keyof ProductCategorySelectionInput) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export function normalizeProductCategoryName(value?: string | null) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

async function assertActiveCategory(
  tx: Prisma.TransactionClient,
  categoryId: string
) {
  const category = await tx.productCategory.findUnique({
    where: {
      id: categoryId
    },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (!category) {
    throw new AppError(404, "Categoría no encontrada");
  }

  if (!category.isActive) {
    throw new AppError(400, `Categoría inactiva: ${category.name}`);
  }

  return category.id;
}

async function getOrCreateActiveCategoryByName(
  tx: Prisma.TransactionClient,
  categoryName: string
) {
  const category = await tx.productCategory.findUnique({
    where: {
      name: categoryName
    },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (category) {
    if (!category.isActive) {
      throw new AppError(400, `Categoría inactiva: ${category.name}`);
    }

    return category.id;
  }

  const createdCategory = await tx.productCategory.create({
    data: {
      name: categoryName,
      description: `Categoría ${categoryName}`,
      isActive: true
    },
    select: {
      id: true
    }
  });

  return createdCategory.id;
}

export async function resolveProductCategorySelection(
  tx: Prisma.TransactionClient,
  input: ProductCategorySelectionInput,
  options: ProductCategorySelectionOptions
) {
  const categoryName = normalizeProductCategoryName(input.categoryName);
  const hasCategoryId = hasOwn(input, "categoryId");
  const hasCategoryName = hasOwn(input, "categoryName");

  if (input.categoryId && categoryName) {
    throw new AppError(
      400,
      "Elige una categoría existente o escribe una nueva, no ambas."
    );
  }

  if (categoryName) {
    return getOrCreateActiveCategoryByName(tx, categoryName);
  }

  if (hasCategoryId) {
    return input.categoryId
      ? assertActiveCategory(tx, input.categoryId)
      : null;
  }

  if (hasCategoryName && !categoryName) {
    return options.defaultToNull ? null : undefined;
  }

  return options.defaultToNull ? null : undefined;
}
