import type { Page, Request, Route } from "@playwright/test";

const REQUEST_PATTERN = "**/*";

type Role = "ADMIN" | "CASHIER";

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
};

type MockSessionOptions = {
  role?: Role;
  authenticated?: boolean;
};

type MockProduct = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  category?: { id: string; name: string } | null;
  salePrice: number;
  finalPrice: number;
  promoPercent: number;
  currentStock: number;
  stock: number;
  isActive: boolean;
  costPrice?: number;
  minStock?: number;
  marginPercent?: number;
};

type MockInventoryMovement = {
  id: string;
  type: "IN" | "OUT" | "SALE" | "RETURN" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  createdAt: string;
  productId: string | null;
  productSku: string;
  productName: string;
  product?: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
  } | null;
  warehouse?: {
    id: string;
    name: string;
  } | null;
};

export const ADMIN_PERMISSIONS = [
  "users:read",
  "users:create",
  "users:toggle-active",
  "users:update-role",
  "users:reset-password",
  "products:read",
  "products:create",
  "products:update",
  "products:toggle-active",
  "products:delete",
  "products:import",
  "inventory:read",
  "inventory:adjust",
  "sales:read",
  "sales:create",
  "sales:cancel",
  "sales:return",
  "cash-register:read",
  "cash-register:operate",
  "cash-register:manage",
  "reports:read",
  "dashboard:read",
  "audit:read",
  "seller-activity:read",
] as const;

export const SELLER_PERMISSIONS = [
  "products:read",
  "inventory:read",
  "sales:read",
  "sales:create",
  "dashboard:read",
] as const;

export function buildMockUser(role: Role): MockUser {
  if (role === "ADMIN") {
    return {
      id: "admin-e2e",
      name: "Admin E2E",
      email: "admin@puntaventa.test",
      role: "ADMIN",
      permissions: [...ADMIN_PERMISSIONS],
    };
  }

  return {
    id: "seller-e2e",
    name: "Vendedor E2E",
    email: "vendedor@puntaventa.test",
    role: "CASHIER",
    permissions: [...SELLER_PERMISSIONS],
  };
}

export async function mockApi(page: Page, options: MockSessionOptions = {}) {
  const role = options.role ?? "ADMIN";
  const authenticated = options.authenticated ?? true;
  const user = buildMockUser(role);
  const products = productsResponse();
  const sales = salesResponse(role);
  const inventoryMovements = inventoryMovementsResponse(products[0]);
  const warehouses = [{ id: "warehouse-1", name: "Principal", isActive: true }];

  await page.route(REQUEST_PATTERN, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const rawPathname = url.pathname;

    if (!rawPathname.startsWith("/api/") && !rawPathname.startsWith("/auth/")) {
      return route.continue();
    }

    const pathname = rawPathname.startsWith("/api/")
      ? rawPathname.slice(4)
      : rawPathname;
    const method = request.method().toUpperCase();

    if (pathname.endsWith("/auth/csrf-token")) {
      return json(route, { csrfToken: "csrf-e2e-token" });
    }

    if (pathname.endsWith("/auth/refresh")) {
      if (!authenticated) {
        return json(route, { message: "Sesión no iniciada" }, 401);
      }

      return json(route, authResponse(user));
    }

    if (pathname.endsWith("/auth/login") && method === "POST") {
      return json(route, authResponse(user));
    }

    if (pathname.endsWith("/auth/logout") && method === "POST") {
      return json(route, { ok: true });
    }

    if (pathname.endsWith("/dashboard")) {
      return json(route, dashboardResponse(role));
    }

    if (pathname.endsWith("/products/categories")) {
      return json(route, [{ id: "category-1", name: "Bebidas" }]);
    }

    if (pathname.endsWith("/products/template/excel") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: "punta-venta-template-e2e",
      });
    }

    if (pathname.endsWith("/products/import/excel") && method === "POST") {
      return json(route, { imported: 1 });
    }

    if (pathname === "/products" && method === "GET") {
      return json(route, filterProductsForRole(products, role, url.searchParams.get("q")));
    }

    if (pathname === "/products" && method === "POST") {
      const payload = readJsonPayload(request) as Partial<MockProduct> & {
        initialStock?: number;
      };
      const createdProduct = buildCreatedProduct(payload, products.length + 1);

      products.push(createdProduct);
      inventoryMovements.unshift(buildInventoryMovement(createdProduct, {
        sequence: inventoryMovements.length + 1,
        type: "IN",
        quantity: createdProduct.stock,
        reason: "Stock inicial",
      }));

      return json(route, createdProduct, 201);
    }

    const productToggleMatch = pathname.match(/^\/products\/([^/]+)\/toggle$/);
    if (productToggleMatch && method === "PATCH") {
      const product = products.find((item) => item.id === productToggleMatch[1]);

      if (!product) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      product.isActive = !product.isActive;

      return json(route, product);
    }

    const productDeleteMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productDeleteMatch && method === "DELETE") {
      const productIndex = products.findIndex((item) => item.id === productDeleteMatch[1]);

      if (productIndex < 0) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      products.splice(productIndex, 1);

      return json(route, {
        message: "Producto eliminado permanentemente. Historial preservado.",
        mode: "deleted",
      });
    }

    if (pathname.endsWith("/inventory/warehouses")) {
      return json(route, warehouses);
    }

    if (pathname.endsWith("/inventory/stock")) {
      return json(route, inventoryStockResponse(products, url.searchParams.get("q")));
    }

    if (pathname.endsWith("/inventory/movements") && method === "GET") {
      return json(route, filterMovements(inventoryMovements, url.searchParams.get("q")));
    }

    if ((pathname.endsWith("/inventory/in") || pathname.endsWith("/inventory/out")) && method === "POST") {
      const type = pathname.endsWith("/inventory/in") ? "IN" : "OUT";
      const payload = readJsonPayload(request) as {
        productId?: string;
        quantity?: number;
        reason?: string;
      };
      const product = products.find((item) => item.id === payload.productId);
      const quantity = Number(payload.quantity ?? 0);

      if (!product) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return json(route, { message: "Cantidad inválida" }, 400);
      }

      if (type === "OUT" && product.stock < quantity) {
        return json(route, { message: "Stock insuficiente" }, 409);
      }

      product.stock += type === "IN" ? quantity : -quantity;
      product.currentStock = product.stock;

      const movement = buildInventoryMovement(product, {
        sequence: inventoryMovements.length + 1,
        type,
        quantity,
        reason: payload.reason ?? "Movimiento E2E",
      });

      inventoryMovements.unshift(movement);

      return json(route, movement, 201);
    }

    if (pathname.endsWith("/sales") && method === "GET") {
      return json(route, sales);
    }

    if (pathname.endsWith("/sales") && method === "POST") {
      const payload = readJsonPayload(request) as {
        customerName?: string;
        paymentMethod?: string;
        paidAmount?: number;
        items?: Array<{ productId: string; quantity: number }>;
      };
      const sale = buildCreatedSale(payload, products, sales.length + 1);

      if (Number(payload.paidAmount ?? 0) < sale.total) {
        return json(
          route,
          { message: `Pago insuficiente. Total: $${sale.total.toFixed(2)}.` },
          400,
        );
      }

      sales.unshift(sale);

      return json(route, sale, 201);
    }

    return json(route, { message: `Mock API route not implemented: ${method} ${pathname}` }, 501);
  });
}

function authResponse(user: MockUser) {
  return {
    accessToken: "e2e-access-token",
    csrfToken: "csrf-e2e-token",
    user,
  };
}

function dashboardResponse(role: Role) {
  const isAdmin = role === "ADMIN";

  return {
    userSummary: isAdmin
      ? {
          totalActive: 3,
          activeAdmins: 1,
          activeCashiers: 2,
        }
      : {
          totalActive: 0,
          activeAdmins: 0,
          activeCashiers: 0,
        },
    productSummary: {
      active: 4,
      lowStockTotal: 2,
      outOfStockTotal: 1,
      lowStockItems: [
        {
          id: "product-critical",
          sku: "COCA-600",
          name: "Coca-Cola 600 ml",
          currentStock: 0,
          minStock: 6,
          severity: "critical",
        },
        {
          id: "product-warning",
          sku: "SAB-ACE-1KG",
          name: "Aceite 1 kg",
          currentStock: 4,
          minStock: 5,
          severity: "warning",
        },
      ],
    },
    salesToday: {
      scope: isAdmin ? "global" : "cashier",
      count: isAdmin ? 7 : 2,
      total: isAdmin ? 2150 : 480,
      averageTicket: isAdmin ? 307.14 : 240,
    },
    cashRegister: {
      scope: isAdmin ? "global" : "cashier",
      hasOpenRegister: false,
      openSessions: 0,
      currentBalance: 0,
      sessions: [],
    },
    recentSales: [
      {
        id: "sale-1",
        folio: "PV-0001",
        total: 320,
        status: "COMPLETED",
        createdAt: "2026-05-22T10:00:00.000Z",
        cashier: {
          id: "seller-e2e",
          name: "Vendedor E2E",
        },
      },
    ],
    products: 4,
    lowStock: 2,
    users: isAdmin ? 3 : 0,
    todaySalesCount: isAdmin ? 7 : 2,
    todaySalesTotal: isAdmin ? 2150 : 480,
  };
}

function productsResponse(): MockProduct[] {
  return [
    {
      id: "product-1",
      sku: "COCA-600",
      barcode: "7501055300075",
      name: "Coca-Cola 600 ml",
      description: "Refresco retornable de prueba",
      category: { id: "category-1", name: "Bebidas" },
      salePrice: 18,
      finalPrice: 18,
      promoPercent: 0,
      currentStock: 24,
      stock: 24,
      isActive: true,
      costPrice: 12,
      minStock: 6,
      marginPercent: 33.33,
    },
  ];
}

function filterProductsForRole(products: MockProduct[], role: Role, query: string | null) {
  const normalizedQuery = normalize(query);
  const visibleProducts = role === "ADMIN"
    ? products
    : products.filter((product) => product.isActive);

  return visibleProducts
    .filter((product) => matchesProduct(product, normalizedQuery))
    .map((product) => formatProductForRole(product, role));
}

function formatProductForRole(product: MockProduct, role: Role) {
  const baseProduct = {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    category: product.category,
    salePrice: product.salePrice,
    finalPrice: product.finalPrice,
    promoPercent: product.promoPercent,
    currentStock: product.currentStock,
    stock: product.stock,
    isActive: product.isActive,
  };

  if (role !== "ADMIN") {
    return baseProduct;
  }

  return {
    ...baseProduct,
    costPrice: product.costPrice,
    minStock: product.minStock,
    marginPercent: product.marginPercent,
  };
}

function buildCreatedProduct(
  payload: Partial<MockProduct> & { initialStock?: number },
  sequence: number,
): MockProduct {
  const salePrice = Number(payload.salePrice ?? 0);
  const promoPercent = Number(payload.promoPercent ?? 0);
  const finalPrice = Number((salePrice * (1 - promoPercent / 100)).toFixed(2));
  const stock = Number(payload.initialStock ?? 0);

  return {
    id: `product-created-${sequence}`,
    sku: String(payload.sku ?? `SKU-${sequence}`),
    barcode: payload.barcode ? String(payload.barcode) : null,
    name: String(payload.name ?? `Producto ${sequence}`),
    description: payload.description ? String(payload.description) : null,
    category: payload.category?.id
      ? payload.category
      : { id: "category-1", name: "Bebidas" },
    salePrice,
    finalPrice,
    promoPercent,
    currentStock: stock,
    stock,
    isActive: true,
    costPrice: Number(payload.costPrice ?? 0),
    minStock: Number(payload.minStock ?? 0),
    marginPercent: salePrice > 0
      ? Number((((salePrice - Number(payload.costPrice ?? 0)) / salePrice) * 100).toFixed(2))
      : 0,
  };
}

function inventoryStockResponse(products: MockProduct[], query: string | null) {
  const normalizedQuery = normalize(query);

  return products
    .filter((product) => matchesProduct(product, normalizedQuery))
    .map((product) => ({
      id: product.id,
      productId: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      categoryName: product.category?.name ?? "Sin categoría",
      warehouseId: "warehouse-1",
      warehouseName: "Principal",
      stock: product.stock,
      currentStock: product.stock,
      minStock: product.minStock ?? 0,
      lowStock: product.stock > 0 && product.stock <= Number(product.minStock ?? 0),
      severity: product.stock <= 0 ? "critical" : "normal",
    }));
}

function inventoryMovementsResponse(product: MockProduct): MockInventoryMovement[] {
  return [
    buildInventoryMovement(product, {
      sequence: 1,
      type: "IN",
      quantity: 24,
      reason: "Stock inicial E2E",
    }),
  ];
}

function buildInventoryMovement(
  product: MockProduct,
  input: {
    sequence: number;
    type: MockInventoryMovement["type"];
    quantity: number;
    reason: string;
  },
): MockInventoryMovement {
  return {
    id: `movement-${input.sequence}`,
    type: input.type,
    quantity: input.quantity,
    reason: input.reason,
    createdAt: "2026-05-22T12:00:00.000Z",
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    product: {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
    },
    warehouse: {
      id: "warehouse-1",
      name: "Principal",
    },
  };
}

function filterMovements(movements: MockInventoryMovement[], query: string | null) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return movements;

  return movements.filter((movement) =>
    [
      movement.type,
      movement.reason,
      movement.productSku,
      movement.productName,
      movement.warehouse?.name,
    ].some((value) => normalize(value).includes(normalizedQuery)),
  );
}

function salesResponse(role: Role) {
  return [
    {
      id: "sale-1",
      folio: "PV-0001",
      subtotal: role === "ADMIN" ? 320 : 180,
      discount: 0,
      tax: 0,
      total: role === "ADMIN" ? 320 : 180,
      status: "COMPLETED",
      paymentMethod: "CASH",
      customerName: "Cliente de prueba",
      customer: {
        id: "customer-1",
        name: "Cliente de prueba",
      },
      createdAt: "2026-05-22T10:00:00.000Z",
      cashier: {
        id: "seller-e2e",
        name: role === "ADMIN" ? "Vendedor E2E" : "Mi usuario",
        email: "vendedor@puntaventa.test",
      },
      payments: [
        {
          id: "payment-1",
          method: "CASH",
          amount: role === "ADMIN" ? 320 : 180,
          createdAt: "2026-05-22T10:00:00.000Z",
        },
      ],
      items: [
        {
          id: "sale-item-1",
          productId: "product-1",
          quantity: 1,
          unitPrice: role === "ADMIN" ? 320 : 180,
          discount: 0,
          total: role === "ADMIN" ? 320 : 180,
          product: {
            id: "product-1",
            sku: "COCA-600",
            name: "Coca-Cola 600 ml",
          },
        },
      ],
      returns: [],
    },
  ];
}

function buildCreatedSale(
  payload: {
    customerName?: string;
    paymentMethod?: string;
    items?: Array<{ productId: string; quantity: number }>;
  },
  products: MockProduct[],
  sequence: number,
) {
  const selectedProduct = products.find((product) => product.id === payload.items?.[0]?.productId) ?? products[0];
  const quantity = payload.items?.[0]?.quantity ?? 1;
  const total = selectedProduct.finalPrice * quantity;
  const createdAt = "2026-05-22T11:00:00.000Z";

  return {
    id: `sale-created-${sequence}`,
    folio: `PV-E2E-${String(sequence).padStart(4, "0")}`,
    subtotal: total,
    discount: 0,
    tax: 0,
    total,
    status: "COMPLETED",
    createdAt,
    customer: payload.customerName
      ? { id: `customer-${sequence}`, name: payload.customerName }
      : null,
    cashier: {
      id: "seller-e2e",
      name: "Vendedor E2E",
      email: "vendedor@puntaventa.test",
    },
    payments: [
      {
        id: `payment-${sequence}`,
        method: payload.paymentMethod ?? "CASH",
        amount: total,
        createdAt,
      },
    ],
    items: [
      {
        id: `sale-item-${sequence}`,
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.finalPrice,
        discount: 0,
        total,
        product: {
          id: selectedProduct.id,
          sku: selectedProduct.sku,
          name: selectedProduct.name,
        },
      },
    ],
    returns: [],
  };
}

function matchesProduct(product: MockProduct, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  return [
    product.sku,
    product.barcode,
    product.name,
    product.description,
    product.category?.name,
  ].some((value) => normalize(value).includes(normalizedQuery));
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function readJsonPayload(request: Request) {
  try {
    return request.postDataJSON();
  } catch {
    return {};
  }
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
