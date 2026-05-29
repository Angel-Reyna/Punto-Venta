import type { MockManagedUser, MockProduct } from "./api-mocks";

export function buildMockManagedUserFixture(
  overrides: Partial<MockManagedUser> = {},
): MockManagedUser {
  const role = overrides.role ?? "CASHIER";
  const id = overrides.id ?? (role === "ADMIN" ? "admin-e2e" : "seller-e2e");
  const name = overrides.name ?? (role === "ADMIN" ? "Admin E2E" : "Vendedor E2E");
  const email = overrides.email ?? (role === "ADMIN"
    ? "admin@puntaventa.test"
    : "vendedor@puntaventa.test");

  return {
    id,
    name,
    email,
    role,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? "2026-05-21T10:00:00.000Z",
  };
}

export function buildMockProductFixture(overrides: Partial<MockProduct> = {}): MockProduct {
  const salePrice = Number(overrides.salePrice ?? 18);
  const promoPercent = Number(overrides.promoPercent ?? 0);
  const costPrice = Number(overrides.costPrice ?? 12);
  const finalPrice = Number(
    overrides.finalPrice ?? (salePrice * (1 - promoPercent / 100)).toFixed(2),
  );
  const stock = Number(overrides.stock ?? overrides.currentStock ?? 24);
  const currentStock = Number(overrides.currentStock ?? stock);
  const marginPercent = salePrice > 0
    ? Number((((salePrice - costPrice) / salePrice) * 100).toFixed(2))
    : 0;

  return {
    id: overrides.id ?? "product-1",
    sku: overrides.sku ?? "COCA-600",
    barcode: overrides.barcode ?? "7501055300075",
    name: overrides.name ?? "Coca-Cola 600 ml",
    description: overrides.description ?? "Refresco retornable de prueba",
    category: overrides.category ?? { id: "category-1", name: "Bebidas" },
    salePrice,
    finalPrice,
    promoPercent,
    currentStock,
    stock,
    isActive: overrides.isActive ?? true,
    costPrice,
    minStock: Number(overrides.minStock ?? 6),
    marginPercent: Number(overrides.marginPercent ?? marginPercent),
  };
}
