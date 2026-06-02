import type { Page, Request, Route } from "@playwright/test";

import { buildMockManagedUserFixture, buildMockProductFixture } from "./api-mock-fixtures";

const REQUEST_PATTERN = "**/*";

export type Role = "ADMIN" | "CASHIER";

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

export type MockProduct = {
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
  reasonType?: "EXPIRATION" | "OTHER";
  unitCostAtMovement?: number;
  costAmount?: number;
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

export type MockManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

type MockAuditLog = {
  id: string;
  action: string;
  tableName: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  user?: MockManagedUser | null;
};

type MockSellerActivityLog = {
  id: string;
  sellerId: string;
  action:
    | "SELLER_LOGIN"
    | "SELLER_LOGOUT"
    | "SALE_CREATED"
    | "SALE_VIEWED"
    | "PRODUCT_VIEWED"
    | "FAILED_ACCESS_ATTEMPT";
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  seller: MockManagedUser;
};

type MockCashMovement = {
  id: string;
  type: "OPENING" | "CASH_IN" | "CASH_OUT" | "SALE_CASH" | "RETURN_CASH";
  amount: number;
  signedAmount?: number;
  reason: string;
  createdAt: string;
};

type MockCashRegisterSession = {
  id: string;
  status: "OPEN" | "CLOSED";
  openingAmount: number;
  expectedClosingAmount: number | null;
  closingAmount: number | null;
  difference: number | null;
  expectedCash: number;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  cashier: {
    id: string;
    name: string;
    email: string;
  };
  movements: MockCashMovement[];
};

type MockCashRegisterState = {
  currentSession: MockCashRegisterSession | null;
  sessions: MockCashRegisterSession[];
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
  const managedUsers = usersResponse();
  const auditLogs = auditLogsResponse(managedUsers);
  const sellerActivityLogs = sellerActivityResponse(managedUsers);
  const cashRegisterState = cashRegisterResponse(managedUsers);

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

    if (pathname === "/users" && method === "GET") {
      return json(route, managedUsers);
    }

    if (pathname === "/users" && method === "POST") {
      const payload = readJsonPayload(request) as Partial<MockManagedUser> & {
        password?: string;
      };
      const createdUser = buildCreatedUser(payload, managedUsers.length + 1);

      managedUsers.push(createdUser);
      auditLogs.unshift(buildAuditLog({
        id: `audit-user-create-${createdUser.id}`,
        action: "USER_CREATE",
        tableName: "User",
        recordId: createdUser.id,
        user: managedUsers[0],
      }));

      return json(route, createdUser, 201);
    }

    const userToggleMatch = pathname.match(/^\/users\/([^/]+)\/toggle$/);
    if (userToggleMatch && method === "PATCH") {
      const targetUser = managedUsers.find((item) => item.id === userToggleMatch[1]);

      if (!targetUser) {
        return json(route, { message: "Usuario no encontrado" }, 404);
      }

      targetUser.isActive = !targetUser.isActive;
      auditLogs.unshift(buildAuditLog({
        id: `audit-user-toggle-${targetUser.id}`,
        action: targetUser.isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE",
        tableName: "User",
        recordId: targetUser.id,
        user: managedUsers[0],
      }));

      return json(route, targetUser);
    }

    const userRoleMatch = pathname.match(/^\/users\/([^/]+)\/role$/);
    if (userRoleMatch && method === "PATCH") {
      const targetUser = managedUsers.find((item) => item.id === userRoleMatch[1]);
      const payload = readJsonPayload(request) as { role?: Role };

      if (!targetUser) {
        return json(route, { message: "Usuario no encontrado" }, 404);
      }

      targetUser.role = payload.role ?? targetUser.role;
      auditLogs.unshift(buildAuditLog({
        id: `audit-user-role-${targetUser.id}`,
        action: "USER_ROLE_UPDATE",
        tableName: "User",
        recordId: targetUser.id,
        user: managedUsers[0],
      }));

      return json(route, targetUser);
    }

    const userPasswordMatch = pathname.match(/^\/users\/([^/]+)\/password$/);
    if (userPasswordMatch && method === "PATCH") {
      const targetUser = managedUsers.find((item) => item.id === userPasswordMatch[1]);

      if (!targetUser) {
        return json(route, { message: "Usuario no encontrado" }, 404);
      }

      auditLogs.unshift(buildAuditLog({
        id: `audit-user-password-${targetUser.id}`,
        action: "USER_PASSWORD_RESET",
        tableName: "User",
        recordId: targetUser.id,
        user: managedUsers[0],
      }));

      return json(route, { ok: true });
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
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

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

    if (pathname === "/products" && method === "DELETE") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const deletedProducts = products.length;

      products.splice(0, products.length);

      return json(route, {
        deletedProducts,
        message: `Se eliminaron ${deletedProducts} productos del catálogo.`,
        mode: "deleted_all",
      });
    }

    const productToggleMatch = pathname.match(/^\/products\/([^/]+)\/toggle$/);
    if (productToggleMatch && method === "PATCH") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const product = products.find((item) => item.id === productToggleMatch[1]);

      if (!product) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      product.isActive = !product.isActive;

      return json(route, product);
    }


    const productUpdateMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productUpdateMatch && method === "PATCH") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const product = products.find((item) => item.id === productUpdateMatch[1]);

      if (!product) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      const payload = readJsonPayload(request) as Partial<MockProduct> & {
        categoryId?: string | null;
      };

      updateMockProduct(product, payload);

      return json(route, product);
    }

    const productDeleteMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productDeleteMatch && method === "DELETE") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

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
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const type = pathname.endsWith("/inventory/in") ? "IN" : "OUT";
      const payload = readJsonPayload(request) as {
        productId?: string;
        quantity?: number;
        reason?: string;
        reasonType?: "EXPIRATION" | "OTHER";
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
        reason: payload.reasonType === "EXPIRATION" ? "Caducidad" : payload.reason ?? "Movimiento E2E",
        reasonType: payload.reasonType ?? "OTHER",
      });

      inventoryMovements.unshift(movement);

      return json(route, movement, 201);
    }

    if (pathname.endsWith("/reports/operations/pdf") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "%PDF-1.4 punta-venta-e2e",
      });
    }

    if (pathname.endsWith("/reports/operations") && method === "GET") {
      return json(route, operationsReportResponse());
    }

    if (pathname.endsWith("/audit") && method === "GET") {
      return json(route, filterAuditLogs(auditLogs, url.searchParams));
    }

    if (pathname.endsWith("/seller-activity/summary") && method === "GET") {
      return json(route, summarizeSellerActivity(filterSellerActivity(sellerActivityLogs, url.searchParams)));
    }

    if (pathname.endsWith("/seller-activity") && method === "GET") {
      return json(route, filterSellerActivity(sellerActivityLogs, url.searchParams));
    }

    if (pathname.endsWith("/cash-register/current") && method === "GET") {
      return json(route, { session: cashRegisterState.currentSession });
    }

    if (pathname.endsWith("/cash-register/sessions") && method === "GET") {
      return json(route, cashRegisterState.sessions);
    }

    if (pathname.endsWith("/cash-register/open") && method === "POST") {
      if (cashRegisterState.currentSession) {
        return json(route, { message: "Ya existe una caja abierta." }, 409);
      }

      const payload = readJsonPayload(request) as {
        openingAmount?: number;
        notes?: string;
      };
      const session = buildOpenedCashRegisterSession({
        amount: Number(payload.openingAmount ?? 0),
        notes: payload.notes ?? null,
        cashier: managedUsers[0],
      });

      cashRegisterState.currentSession = session;

      return json(route, session, 201);
    }

    if (pathname.endsWith("/cash-register/movements") && method === "POST") {
      if (!cashRegisterState.currentSession) {
        return json(route, { message: "Primero abre caja." }, 409);
      }

      const payload = readJsonPayload(request) as {
        type?: "CASH_IN" | "CASH_OUT";
        amount?: number;
        reason?: string;
      };
      const amount = Number(payload.amount ?? 0);
      const type = payload.type ?? "CASH_IN";

      if (!Number.isFinite(amount) || amount <= 0) {
        return json(route, { message: "Monto inválido." }, 400);
      }

      const movement = buildCashMovement({
        id: `cash-movement-${cashRegisterState.currentSession.movements.length + 1}`,
        type,
        amount,
        reason: payload.reason ?? "Movimiento manual E2E",
      });

      cashRegisterState.currentSession.movements.unshift(movement);
      cashRegisterState.currentSession.expectedCash += movement.signedAmount ?? amount;
      cashRegisterState.currentSession.expectedClosingAmount = cashRegisterState.currentSession.expectedCash;

      return json(route, movement, 201);
    }

    if (pathname.endsWith("/cash-register/close") && method === "POST") {
      if (!cashRegisterState.currentSession) {
        return json(route, { message: "Primero abre caja." }, 409);
      }

      const payload = readJsonPayload(request) as {
        closingAmount?: number;
        notes?: string;
      };
      const session = cashRegisterState.currentSession;
      const closingAmount = Number(payload.closingAmount ?? session.expectedCash);

      session.status = "CLOSED";
      session.closingAmount = closingAmount;
      session.expectedClosingAmount = session.expectedCash;
      session.difference = Number((closingAmount - session.expectedCash).toFixed(2));
      session.closedAt = "2026-05-22T18:00:00.000Z";
      session.notes = payload.notes ?? session.notes;

      cashRegisterState.sessions.unshift(session);
      cashRegisterState.currentSession = null;

      return json(route, session);
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
      shrinkageUnitsToday: isAdmin ? 3 : 0,
      shrinkageCostToday: isAdmin ? 54 : 0,
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
  return [buildMockProductFixture()];
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

function updateMockProduct(
  product: MockProduct,
  payload: Partial<MockProduct> & { categoryId?: string | null },
) {
  const salePrice = Number(payload.salePrice ?? product.salePrice);
  const promoPercent = Number(payload.promoPercent ?? product.promoPercent);
  const costPrice = Number(payload.costPrice ?? product.costPrice ?? 0);

  product.sku = String(payload.sku ?? product.sku);
  product.barcode = payload.barcode ? String(payload.barcode) : null;
  product.name = String(payload.name ?? product.name);
  product.description = payload.description ? String(payload.description) : null;
  product.category = payload.category?.id
    ? payload.category
    : payload.categoryId === null
      ? null
      : product.category;
  product.salePrice = salePrice;
  product.promoPercent = promoPercent;
  product.finalPrice = Number((salePrice * (1 - promoPercent / 100)).toFixed(2));
  product.costPrice = costPrice;
  product.minStock = Number(payload.minStock ?? product.minStock ?? 0);
  product.marginPercent = salePrice > 0
    ? Number((((salePrice - costPrice) / salePrice) * 100).toFixed(2))
    : 0;
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
    reasonType?: "EXPIRATION" | "OTHER";
  },
): MockInventoryMovement {
  return {
    id: `movement-${input.sequence}`,
    type: input.type,
    quantity: input.quantity,
    reason: input.reason,
    reasonType: input.reasonType,
    unitCostAtMovement: product.costPrice ?? 0,
    costAmount: (product.costPrice ?? 0) * input.quantity,
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


function usersResponse(): MockManagedUser[] {
  return [
    buildMockManagedUserFixture({
      id: "admin-e2e",
      role: "ADMIN",
      createdAt: "2026-05-20T09:00:00.000Z",
    }),
    buildMockManagedUserFixture(),
    buildMockManagedUserFixture({
      id: "seller-inactive-e2e",
      name: "Vendedor Inactivo E2E",
      email: "inactivo@puntaventa.test",
      isActive: false,
      createdAt: "2026-05-21T11:00:00.000Z",
    }),
  ];
}

function buildCreatedUser(
  payload: Partial<MockManagedUser>,
  sequence: number,
): MockManagedUser {
  return {
    id: `user-created-${sequence}`,
    name: String(payload.name ?? `Usuario ${sequence}`),
    email: String(payload.email ?? `usuario-${sequence}@puntaventa.test`).toLowerCase(),
    role: payload.role ?? "CASHIER",
    isActive: true,
    createdAt: "2026-05-22T13:00:00.000Z",
  };
}

function buildAuditLog(input: {
  id: string;
  action: string;
  tableName: string;
  recordId?: string | null;
  user?: MockManagedUser | null;
}): MockAuditLog {
  return {
    id: input.id,
    action: input.action,
    tableName: input.tableName,
    recordId: input.recordId ?? null,
    oldData: null,
    newData: { e2e: true },
    ipAddress: "127.0.0.1",
    createdAt: "2026-05-22T13:30:00.000Z",
    user: input.user ?? null,
  };
}

function auditLogsResponse(users: MockManagedUser[]): MockAuditLog[] {
  const admin = users.find((item) => item.role === "ADMIN") ?? users[0];
  const seller = users.find((item) => item.role === "CASHIER") ?? users[0];

  return [
    buildAuditLog({
      id: "audit-1",
      action: "PRODUCT_DELETE",
      tableName: "Product",
      recordId: "product-deleted-snapshot",
      user: admin,
    }),
    buildAuditLog({
      id: "audit-2",
      action: "SALE_CREATE",
      tableName: "Sale",
      recordId: "sale-1",
      user: seller,
    }),
    buildAuditLog({
      id: "audit-3",
      action: "USER_PASSWORD_RESET",
      tableName: "User",
      recordId: "seller-e2e",
      user: admin,
    }),
  ];
}

function filterAuditLogs(logs: MockAuditLog[], params: URLSearchParams) {
  const query = normalize(params.get("q"));
  const action = normalize(params.get("action"));
  const tableName = normalize(params.get("tableName"));

  return logs.filter((log) => {
    const matchesQuery = query
      ? [
          log.action,
          log.tableName,
          log.recordId,
          log.user?.name,
          log.user?.email,
          log.ipAddress,
        ].some((value) => normalize(value).includes(query))
      : true;
    const matchesAction = action ? normalize(log.action) === action : true;
    const matchesTableName = tableName ? normalize(log.tableName) === tableName : true;

    return matchesQuery && matchesAction && matchesTableName;
  });
}

function sellerActivityResponse(users: MockManagedUser[]): MockSellerActivityLog[] {
  const seller = users.find((item) => item.id === "seller-e2e") ?? users[0];
  const inactiveSeller = users.find((item) => item.id === "seller-inactive-e2e") ?? seller;

  return [
    {
      id: "seller-activity-1",
      sellerId: seller.id,
      action: "SALE_CREATED",
      entityType: "Sale",
      entityId: "PV-0001",
      description: "Venta registrada por Vendedor E2E por $320.00",
      metadata: { total: 320 },
      ipAddress: "127.0.0.1",
      userAgent: "Playwright Chromium",
      createdAt: "2026-05-22T10:00:00.000Z",
      seller,
    },
    {
      id: "seller-activity-2",
      sellerId: seller.id,
      action: "SELLER_LOGIN",
      entityType: "AuthSession",
      entityId: "session-e2e",
      description: "Inicio de sesión de vendedor autorizado",
      ipAddress: "127.0.0.1",
      userAgent: "Playwright Chromium",
      createdAt: "2026-05-22T09:50:00.000Z",
      seller,
    },
    {
      id: "seller-activity-3",
      sellerId: inactiveSeller.id,
      action: "FAILED_ACCESS_ATTEMPT",
      entityType: "Permission",
      entityId: "reports:read",
      description: "Acceso bloqueado a Reportes para vendedor sin permiso",
      ipAddress: "127.0.0.2",
      userAgent: "Playwright Chromium",
      createdAt: "2026-05-22T09:45:00.000Z",
      seller: inactiveSeller,
    },
  ];
}

function filterSellerActivity(logs: MockSellerActivityLog[], params: URLSearchParams) {
  const sellerId = params.get("sellerId") ?? "";
  const action = params.get("action") ?? "";
  const limit = Number(params.get("limit") ?? 200);

  return logs
    .filter((log) => (sellerId ? log.sellerId === sellerId : true))
    .filter((log) => (action ? log.action === action : true))
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 200);
}

function summarizeSellerActivity(logs: MockSellerActivityLog[]) {
  const counts = new Map<MockSellerActivityLog["action"], number>();

  for (const log of logs) {
    counts.set(log.action, (counts.get(log.action) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([action, count]) => ({ action, count }));
}

function cashRegisterResponse(users: MockManagedUser[]): MockCashRegisterState {
  const admin = users.find((item) => item.role === "ADMIN") ?? users[0];

  return {
    currentSession: null,
    sessions: [
      {
        id: "cash-session-closed-e2e",
        status: "CLOSED",
        openingAmount: 50,
        expectedClosingAmount: 85,
        closingAmount: 85,
        difference: 0,
        expectedCash: 85,
        openedAt: "2026-05-21T09:00:00.000Z",
        closedAt: "2026-05-21T18:00:00.000Z",
        notes: "Corte histórico E2E",
        cashier: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
        movements: [
          buildCashMovement({
            id: "cash-movement-historic-1",
            type: "OPENING",
            amount: 50,
            reason: "Apertura histórica E2E",
          }),
          buildCashMovement({
            id: "cash-movement-historic-2",
            type: "CASH_IN",
            amount: 35,
            reason: "Entrada histórica E2E",
          }),
        ],
      },
    ],
  };
}

function buildOpenedCashRegisterSession(input: {
  amount: number;
  notes: string | null;
  cashier: MockManagedUser;
}): MockCashRegisterSession {
  return {
    id: "cash-session-open-e2e",
    status: "OPEN",
    openingAmount: input.amount,
    expectedClosingAmount: input.amount,
    closingAmount: null,
    difference: null,
    expectedCash: input.amount,
    openedAt: "2026-05-22T09:00:00.000Z",
    closedAt: null,
    notes: input.notes,
    cashier: {
      id: input.cashier.id,
      name: input.cashier.name,
      email: input.cashier.email,
    },
    movements: [
      buildCashMovement({
        id: "cash-movement-opening-e2e",
        type: "OPENING",
        amount: input.amount,
        reason: "Apertura de caja",
      }),
    ],
  };
}

function buildCashMovement(input: {
  id: string;
  type: MockCashMovement["type"];
  amount: number;
  reason: string;
}): MockCashMovement {
  const signedAmount = input.type === "CASH_OUT" || input.type === "RETURN_CASH"
    ? -input.amount
    : input.amount;

  return {
    id: input.id,
    type: input.type,
    amount: input.amount,
    signedAmount,
    reason: input.reason,
    createdAt: "2026-05-22T12:00:00.000Z",
  };
}

function operationsReportResponse() {
  return {
    from: "2026-05-22",
    to: "2026-05-22",
    fromLabel: "22 may 2026",
    toLabel: "22 may 2026",
    sales: {
      count: 2,
      byStatus: {
        COMPLETED: 1,
        PARTIALLY_REFUNDED: 1,
      },
      gross: 520,
      refunded: 50,
      net: 470,
      paymentSummary: {
        CASH: 320,
        CARD: 200,
      },
      profit: {
        grossCost: 260,
        returnedCost: 25,
        netCost: 235,
        grossProfit: 260,
        returnedProfit: 25,
        netProfit: 235,
        marginPercent: 50,
      },
      bySeller: [
        {
          seller: {
            id: "seller-e2e",
            name: "Vendedor E2E",
            email: "vendedor@puntaventa.test",
          },
          count: 2,
          gross: 520,
          refunded: 50,
          net: 470,
        },
      ],
      recent: [
        {
          id: "sale-1",
          folio: "PV-0001",
          status: "COMPLETED",
          total: 320,
          createdAt: "2026-05-22T10:00:00.000Z",
          cashier: {
            id: "seller-e2e",
            name: "Vendedor E2E",
            email: "vendedor@puntaventa.test",
          },
          payments: [
            {
              id: "payment-1",
              method: "CASH",
              amount: 320,
            },
          ],
        },
      ],
    },
    returns: {
      count: 1,
      total: 50,
      byMethod: {
        CASH: 50,
      },
      latest: [
        {
          id: "return-1",
          reason: "Devolución parcial E2E",
          refundMethod: "CASH",
          refundTotal: 50,
          createdAt: "2026-05-22T10:30:00.000Z",
          cashier: {
            id: "seller-e2e",
            name: "Vendedor E2E",
            email: "vendedor@puntaventa.test",
          },
        },
      ],
    },
    cashRegister: {
      sessions: [],
      movements: {
        count: 0,
        summary: {},
      },
    },
    topProducts: [
      {
        product: {
          id: "deleted-product-e2e",
          sku: "SNAP-DEL",
          name: "Producto eliminado snapshot E2E",
        },
        quantity: 3,
        total: 270,
        cost: 150,
        grossProfit: 120,
      },
      {
        product: {
          id: "product-1",
          sku: "COCA-600",
          name: "Coca-Cola 600 ml",
        },
        quantity: 2,
        total: 200,
        cost: 85,
        grossProfit: 115,
      },
    ],
  };
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
    paymentMethod: payload.paymentMethod ?? "CASH",
    customerName: payload.customerName ?? "Cliente E2E",
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
