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
  const products = productsResponse(role);
  const sales = salesResponse(role);

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

    if (pathname.endsWith("/products")) {
      return json(route, products);
    }

    if (pathname.endsWith("/inventory/warehouses")) {
      return json(route, [{ id: "warehouse-1", name: "Principal" }]);
    }

    if (pathname.endsWith("/inventory/stock")) {
      return json(route, inventoryStockResponse());
    }

    if (pathname.endsWith("/inventory/movements")) {
      return json(route, []);
    }

    if (pathname.endsWith("/sales") && method === "GET") {
      return json(route, sales);
    }

    if (pathname.endsWith("/sales") && method === "POST") {
      const payload = readJsonPayload(request) as {
        customerName?: string;
        paymentMethod?: string;
        items?: Array<{ productId: string; quantity: number }>;
      };
      const sale = buildCreatedSale(payload, sales.length + 1);

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

function productsResponse(role: Role) {
  const isAdmin = role === "ADMIN";

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
      ...(isAdmin
        ? {
            costPrice: 12,
            minStock: 6,
            marginPercent: 33.33,
          }
        : {}),
    },
  ];
}

function inventoryStockResponse() {
  return [
    {
      id: "product-1",
      productId: "product-1",
      sku: "COCA-600",
      barcode: "7501055300075",
      name: "Coca-Cola 600 ml",
      category: { id: "category-1", name: "Bebidas" },
      categoryName: "Bebidas",
      warehouseId: "warehouse-1",
      warehouseName: "Principal",
      stock: 24,
      currentStock: 24,
      minStock: 6,
      lowStock: false,
      severity: "normal",
    },
  ];
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
  sequence: number
) {
  const quantity = payload.items?.[0]?.quantity ?? 1;
  const total = 18 * quantity;
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
        productId: "product-1",
        quantity,
        unitPrice: 18,
        discount: 0,
        total,
        product: {
          id: "product-1",
          sku: "COCA-600",
          name: "Coca-Cola 600 ml",
        },
      },
    ],
    returns: [],
  };
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
