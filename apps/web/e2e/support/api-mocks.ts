import type { Page, Route } from "@playwright/test";

const API_PATTERN = "**/api/**";

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

  await page.route(API_PATTERN, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
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
      return json(route, productsResponse(role));
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

    if (pathname.endsWith("/sales")) {
      return json(route, salesResponse(role));
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
      productId: "product-1",
      sku: "COCA-600",
      barcode: "7501055300075",
      name: "Coca-Cola 600 ml",
      categoryName: "Bebidas",
      warehouseId: "warehouse-1",
      warehouseName: "Principal",
      currentStock: 24,
      minStock: 6,
      severity: "normal",
    },
  ];
}

function salesResponse(role: Role) {
  return [
    {
      id: "sale-1",
      folio: "PV-0001",
      total: role === "ADMIN" ? 320 : 180,
      status: "COMPLETED",
      paymentMethod: "CASH",
      customerName: "Cliente de prueba",
      createdAt: "2026-05-22T10:00:00.000Z",
      cashier: {
        id: "seller-e2e",
        name: role === "ADMIN" ? "Vendedor E2E" : "Mi usuario",
        email: "vendedor@puntaventa.test",
      },
      items: [],
    },
  ];
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}
