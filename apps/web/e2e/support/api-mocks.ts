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

type MockInventoryBalanceMap = Map<string, Map<string, number>>;

type MockSaleItem = {
  id: string;
  productId?: string | null;
  productSku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  } | null;
};

type MockSaleReturn = {
  id: string;
  reason: string;
  refundMethod: string;
  refundTotal: number;
  createdAt: string;
  items: Array<{
    id: string;
    saleItemId: string;
    productId?: string | null;
    productSku?: string;
    productName?: string;
    quantity: number;
    total: number;
  }>;
};

type MockSale = {
  id: string;
  folio: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  customerName?: string;
  customer?: { id: string; name: string } | null;
  createdAt: string;
  cashier: { id: string; name: string; email: string };
  payments: Array<{ id: string; method: string; amount: number; createdAt: string }>;
  items: MockSaleItem[];
  returns: MockSaleReturn[];
};

type MockSaleAdjustmentRequest = {
  id: string;
  type: "CANCEL_SALE" | "RETURN_ITEMS";
  status: "PENDING" | "APPROVED" | "REJECTED";
  saleId: string;
  requestedById: string;
  reviewedById?: string | null;
  reason: string;
  refundMethod?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  sale: Pick<MockSale, "id" | "folio" | "status" | "total" | "createdAt" | "cashier">;
  requestedBy: MockManagedUser;
  reviewedBy?: MockManagedUser | null;
  items: Array<{
    id: string;
    saleItemId: string;
    productId?: string | null;
    productSku?: string;
    productName?: string;
    quantity: number;
    saleItem?: Pick<MockSaleItem, "id" | "quantity" | "productSku" | "productName">;
    product?: {
      id?: string | null;
      sku: string;
      name: string;
    } | null;
  }>;
};

type MockInventoryTransferRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  fromWarehouse: MockWarehouse;
  toWarehouse: MockWarehouse;
  requestedBy: MockManagedUser;
  reviewedBy?: MockManagedUser | null;
  totalUnits: number;
  items: Array<{
    id: string;
    productId: string | null;
    productSku: string;
    productName: string;
    quantity: number;
  }>;
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

type MockWarehouse = {
  id: string;
  name: string;
  description?: string | null;
  type?: "STORAGE" | "SELLER";
  sellerId?: string | null;
  isActive: boolean;
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
  "inventory-transfer-requests:read",
  "inventory-transfer-requests:create",
  "inventory-transfer-requests:review",
  "sales:read",
  "sales:create",
  "sales:cancel",
  "sales:return",
  "sales-adjustments:read",
  "sales-adjustments:create",
  "sales-adjustments:review",
  "reports:read",
  "dashboard:read",
  "audit:read",
  "seller-activity:read",
] as const;

export const SELLER_PERMISSIONS = [
  "products:read",
  "inventory:read",
  "inventory-transfer-requests:read",
  "inventory-transfer-requests:create",
  "sales:read",
  "sales:create",
  "sales-adjustments:read",
  "sales-adjustments:create",
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
  const categories = [{ id: "category-1", name: "Bebidas" }];
  const products = productsResponse();
  const sales = salesResponse(role);
  const inventoryMovements = inventoryMovementsResponse(products[0]);
  const warehouses: MockWarehouse[] = [
    { id: "warehouse-1", name: "Principal", description: "Almacén: Principal", type: "STORAGE", isActive: true },
  ];
  const inventoryBalances: MockInventoryBalanceMap = new Map(
    products.map((product) => [
      product.id,
      new Map([["warehouse-1", product.stock]]),
    ]),
  );
  const managedUsers = usersResponse();
  const adjustmentRequests = adjustmentRequestsResponse(role, sales, managedUsers);
  const inventoryTransferRequests = inventoryTransferRequestsResponse(role, managedUsers, warehouses, products);
  const auditLogs = auditLogsResponse(managedUsers);
  const sellerActivityLogs = sellerActivityResponse(managedUsers);

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
      return json(route, categories);
    }

    if (pathname.endsWith("/products/template/excel") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: "punta-venta-template-e2e",
      });
    }

    if (pathname.endsWith("/products/import/excel") && method === "POST") {
      return json(route, {
        imported: 1,
        created: 1,
        updated: 0,
        withInitialStock: 1,
        message: "Importación finalizada: 1 producto procesado."
      });
    }

    if (pathname === "/products" && method === "GET") {
      return json(route, filterProductsForRole(products, role, url.searchParams.get("q")));
    }

    if (pathname === "/products" && method === "POST") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const payload = readJsonPayload(request) as Partial<MockProduct> & {
        categoryId?: string | null;
        categoryName?: string | null;
        initialStock?: number;
      };
      const createdProduct = buildCreatedProduct(
        payload,
        products.length + 1,
        categories,
      );

      products.push(createdProduct);
      inventoryBalances.set(
        createdProduct.id,
        new Map([["warehouse-1", createdProduct.stock]]),
      );
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
      inventoryBalances.clear();

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

      const payload = readJsonPayload(request) as { isActive?: boolean };

      product.isActive = payload.isActive ?? !product.isActive;

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
        categoryName?: string | null;
      };

      updateMockProduct(product, payload, categories);

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

      inventoryBalances.delete(products[productIndex].id);
      products.splice(productIndex, 1);

      return json(route, {
        message: "Producto eliminado permanentemente. Historial preservado.",
        mode: "deleted",
      });
    }

    if (pathname.endsWith("/inventory/warehouses") && method === "GET") {
      return json(route, warehouses.filter((warehouse) => (warehouse.type ?? "STORAGE") === "STORAGE"));
    }

    if (pathname.endsWith("/inventory/warehouses") && method === "POST") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const payload = readJsonPayload(request) as {
        name?: string;
        description?: string | null;
      };
      const warehouseName = String(payload.name ?? "").trim().replace(/\s+/gu, " ");

      if (warehouseName.length < 2) {
        return json(route, { message: "El nombre del almacén debe tener al menos 2 caracteres." }, 400);
      }

      const existingWarehouse = warehouses.find(
        (warehouse) => normalize(warehouse.name) === normalize(warehouseName),
      );

      if (existingWarehouse) {
        return json(route, { message: "Ya existe un almacén activo con ese nombre." }, 409);
      }

      const warehouse = {
        id: `warehouse-${warehouses.length + 1}`,
        name: warehouseName,
        description: payload.description ? String(payload.description).trim() : null,
        type: "STORAGE",
        isActive: true,
      };

      warehouses.push(warehouse);

      return json(route, warehouse, 201);
    }


    if (pathname.endsWith("/inventory/transfer-requests") && method === "GET") {
      return json(route, filterInventoryTransferRequests(
        inventoryTransferRequests,
        role,
        url.searchParams.get("status"),
      ));
    }

    if (pathname.endsWith("/inventory/transfer-requests") && method === "POST") {
      if (role !== "CASHIER") {
        return json(route, { message: "Solo vendedores pueden solicitar retiro de stock." }, 400);
      }

      const payload = readJsonPayload(request) as {
        fromWarehouseId?: string | null;
        reason?: string;
        items?: Array<{ productId?: string; quantity?: number }>;
      };
      const fromWarehouse = warehouses.find((warehouse) => warehouse.id === (payload.fromWarehouseId ?? "warehouse-1")) ?? warehouses[0];
      const seller = managedUsers.find((item) => item.id === "seller-e2e") ?? managedUsers[1];
      const toWarehouse = ensureMockSellerWarehouse(warehouses, seller);
      const itemPayload = payload.items?.[0];
      const product = products.find((item) => item.id === itemPayload?.productId);
      const quantity = Number(itemPayload?.quantity ?? 0);

      if (!product) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      const currentStock = inventoryBalances.get(product.id)?.get(fromWarehouse.id) ?? 0;

      if (currentStock < quantity) {
        return json(route, { message: `Stock insuficiente para ${product.name}. Almacén: ${fromWarehouse.name}.` }, 409);
      }

      const createdRequest = buildInventoryTransferRequest({
        id: `transfer-${inventoryTransferRequests.length + 1}`,
        fromWarehouse,
        product,
        quantity,
        reason: payload.reason ?? "Solicitud E2E",
        requestedBy: seller,
        status: "PENDING",
        toWarehouse,
      });

      inventoryTransferRequests.unshift(createdRequest);

      return json(route, createdRequest, 201);
    }

    const transferApproveMatch = pathname.match(/^\/inventory\/transfer-requests\/([^/]+)\/approve$/);
    if (transferApproveMatch && method === "POST") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const transferRequest = inventoryTransferRequests.find((item) => item.id === transferApproveMatch[1]);

      if (!transferRequest) {
        return json(route, { message: "Solicitud de retiro no encontrada" }, 404);
      }

      transferRequest.status = "APPROVED";
      transferRequest.reviewedAt = "2026-06-05T20:00:00.000Z";
      transferRequest.reviewedBy = managedUsers[0];
      transferRequest.reviewNote = (readJsonPayload(request) as { reviewNote?: string | null }).reviewNote ?? null;

      for (const item of transferRequest.items) {
        const product = products.find((candidate) => candidate.id === item.productId);

        if (!product) continue;

        const productBalances = inventoryBalances.get(product.id) ?? new Map<string, number>();
        const sourceStock = productBalances.get(transferRequest.fromWarehouse.id) ?? 0;
        const destinationStock = productBalances.get(transferRequest.toWarehouse.id) ?? 0;

        productBalances.set(transferRequest.fromWarehouse.id, sourceStock - item.quantity);
        productBalances.set(transferRequest.toWarehouse.id, destinationStock + item.quantity);
        inventoryBalances.set(product.id, productBalances);
        inventoryMovements.unshift(buildInventoryMovement(product, {
          sequence: inventoryMovements.length + 1,
          type: "OUT",
          quantity: item.quantity,
          reason: `Retiro aprobado para ${transferRequest.toWarehouse.name}`,
          warehouse: transferRequest.fromWarehouse,
        }));
      }

      return json(route, transferRequest);
    }

    const transferRejectMatch = pathname.match(/^\/inventory\/transfer-requests\/([^/]+)\/reject$/);
    if (transferRejectMatch && method === "POST") {
      if (role !== "ADMIN") {
        return json(route, { message: "No autorizado" }, 403);
      }

      const transferRequest = inventoryTransferRequests.find((item) => item.id === transferRejectMatch[1]);

      if (!transferRequest) {
        return json(route, { message: "Solicitud de retiro no encontrada" }, 404);
      }

      transferRequest.status = "REJECTED";
      transferRequest.reviewedAt = "2026-06-05T20:00:00.000Z";
      transferRequest.reviewedBy = managedUsers[0];
      transferRequest.reviewNote = (readJsonPayload(request) as { reviewNote?: string | null }).reviewNote ?? null;

      return json(route, transferRequest);
    }

    if (pathname.endsWith("/inventory/stock")) {
      return json(route, inventoryStockResponse(products, warehouses, inventoryBalances, url.searchParams.get("q")));
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
        warehouseId?: string;
      };
      const product = products.find((item) => item.id === payload.productId);
      const warehouse = payload.warehouseId
        ? warehouses.find((item) => item.id === payload.warehouseId)
        : warehouses[0];
      const quantity = Number(payload.quantity ?? 0);

      if (!product) {
        return json(route, { message: "Producto no encontrado" }, 404);
      }

      if (!warehouse) {
        return json(route, { message: "Almacén no encontrado" }, 404);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return json(route, { message: "Cantidad inválida" }, 400);
      }

      const productBalances = inventoryBalances.get(product.id) ?? new Map<string, number>();
      const currentWarehouseStock = productBalances.get(warehouse.id) ?? 0;

      if (type === "OUT" && currentWarehouseStock < quantity) {
        return json(
          route,
          { message: `Stock insuficiente. Almacén: ${warehouse.name}. Stock actual: ${currentWarehouseStock}.` },
          409,
        );
      }

      product.stock += type === "IN" ? quantity : -quantity;
      product.currentStock = product.stock;

      productBalances.set(
        warehouse.id,
        type === "IN" ? currentWarehouseStock + quantity : currentWarehouseStock - quantity,
      );
      inventoryBalances.set(product.id, productBalances);

      const movement = buildInventoryMovement(product, {
        sequence: inventoryMovements.length + 1,
        type,
        quantity,
        reason: payload.reasonType === "EXPIRATION" ? "Caducidad" : payload.reason ?? "Movimiento E2E",
        reasonType: payload.reasonType ?? "OTHER",
        warehouse,
      });

      inventoryMovements.unshift(movement);

      return json(route, movement, 201);
    }

    if (pathname.endsWith("/reports/operations/pdf") && method === "GET") {
      if (!url.searchParams.get("from") || !url.searchParams.get("to")) {
        return json(route, { message: "Debes enviar fecha inicial y fecha final" }, 400);
      }

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

    if (pathname.endsWith("/sales/adjustment-requests") && method === "GET") {
      const visibleRequests = role === "ADMIN"
        ? adjustmentRequests
        : adjustmentRequests.filter((request) => request.requestedById === user.id);

      return json(route, visibleRequests);
    }

    const adjustmentCreateMatch = pathname.match(/^\/sales\/([^/]+)\/adjustment-requests$/);
    if (adjustmentCreateMatch && method === "POST") {
      const sale = sales.find((item) => item.id === adjustmentCreateMatch[1]);

      if (!sale) {
        return json(route, { message: "Venta no encontrada" }, 404);
      }

      const existingPendingRequest = adjustmentRequests.find(
        (request) => request.saleId === sale.id && request.status === "PENDING",
      );

      if (existingPendingRequest) {
        return json(route, { message: "Ya existe una solicitud pendiente para esta venta" }, 409);
      }

      const payload = readJsonPayload(request) as {
        type?: "CANCEL_SALE" | "RETURN_ITEMS";
        reason?: string;
        refundMethod?: string;
        items?: Array<{ saleItemId: string; quantity: number }>;
      };
      const createdRequest = buildAdjustmentRequest({
        id: `adjustment-${adjustmentRequests.length + 1}`,
        sale,
        requestedBy: userToManagedUser(user),
        type: payload.type ?? "RETURN_ITEMS",
        reason: payload.reason ?? "Solicitud E2E",
        refundMethod: payload.refundMethod ?? "CASH",
        items: payload.items ?? [],
      });

      adjustmentRequests.unshift(createdRequest);

      return json(route, createdRequest, 201);
    }

    const adjustmentReviewMatch = pathname.match(/^\/sales\/adjustment-requests\/([^/]+)\/(approve|reject)$/);
    if (adjustmentReviewMatch && method === "POST") {
      const targetRequest = adjustmentRequests.find((item) => item.id === adjustmentReviewMatch[1]);
      const action = adjustmentReviewMatch[2];

      if (!targetRequest) {
        return json(route, { message: "Solicitud no encontrada" }, 404);
      }

      if (targetRequest.status !== "PENDING") {
        return json(route, { message: "La solicitud ya fue revisada" }, 409);
      }

      const payload = readJsonPayload(request) as { reviewNote?: string };
      const reviewer = userToManagedUser(user);

      if (action === "approve") {
        targetRequest.status = "APPROVED";
        targetRequest.reviewedBy = reviewer;
        targetRequest.reviewedById = reviewer.id;
        targetRequest.reviewedAt = "2026-05-22T14:00:00.000Z";
        targetRequest.reviewNote = payload.reviewNote ?? null;

        applyApprovedAdjustmentRequest(targetRequest, sales);
      } else {
        targetRequest.status = "REJECTED";
        targetRequest.reviewedBy = reviewer;
        targetRequest.reviewedById = reviewer.id;
        targetRequest.reviewedAt = "2026-05-22T14:00:00.000Z";
        targetRequest.reviewNote = payload.reviewNote ?? null;
      }

      return json(route, targetRequest);
    }

    if (pathname.endsWith("/sales") && method === "GET") {
      return json(route, sales);
    }

    const saleReturnMatch = pathname.match(/\/sales\/([^/]+)\/returns$/);

    if (saleReturnMatch && method === "POST") {
      const sale = sales.find((item) => item.id === saleReturnMatch[1]);

      if (!sale) {
        return json(route, { message: "Venta no encontrada" }, 404);
      }

      const payload = readJsonPayload(request) as {
        reason?: string;
        refundMethod?: string;
        items?: Array<{ saleItemId: string; quantity: number }>;
      };
      const returnedQuantities = new Map<string, number>();

      for (const saleReturn of sale.returns ?? []) {
        for (const item of saleReturn.items ?? []) {
          returnedQuantities.set(
            item.saleItemId,
            (returnedQuantities.get(item.saleItemId) ?? 0) + Number(item.quantity ?? 0),
          );
        }
      }

      const returnItems = [];

      for (const item of payload.items ?? []) {
        const saleItem = sale.items.find((candidate) => candidate.id === item.saleItemId);

        if (!saleItem) {
          return json(route, { message: "La partida no pertenece a la venta" }, 400);
        }

        const alreadyReturned = returnedQuantities.get(saleItem.id) ?? 0;
        const available = saleItem.quantity - alreadyReturned;

        if (item.quantity <= 0 || item.quantity > available) {
          return json(route, { message: `Cantidad inválida para ${saleItem.product?.name ?? saleItem.productName ?? "producto"}` }, 409);
        }

        const unitTotal = Number(saleItem.total) / Number(saleItem.quantity);

        returnItems.push({
          id: `return-item-${saleItem.id}`,
          saleItemId: saleItem.id,
          productId: saleItem.productId,
          productSku: saleItem.productSku ?? saleItem.product?.sku,
          productName: saleItem.productName ?? saleItem.product?.name,
          quantity: item.quantity,
          total: Number((unitTotal * item.quantity).toFixed(2)),
        });
      }

      const refundTotal = returnItems.reduce((sum, item) => sum + item.total, 0);
      const saleReturn = {
        id: `return-${sale.id}-${(sale.returns?.length ?? 0) + 1}`,
        reason: payload.reason ?? "Devolución E2E",
        refundMethod: payload.refundMethod ?? "CASH",
        refundTotal,
        createdAt: "2026-05-22T12:00:00.000Z",
        items: returnItems,
      };

      sale.returns = [saleReturn, ...(sale.returns ?? [])];

      const allReturned = sale.items.every((saleItem) => {
        const returnedInThisRequest = returnItems
          .filter((item) => item.saleItemId === saleItem.id)
          .reduce((sum, item) => sum + item.quantity, 0);
        const previouslyReturned = returnedQuantities.get(saleItem.id) ?? 0;

        return previouslyReturned + returnedInThisRequest >= saleItem.quantity;
      });

      sale.status = allReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";

      return json(route, sale);
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
    buildMockProductFixture(),
    buildMockProductFixture({
      id: "product-2",
      sku: "BOTANA-50G",
      barcode: "7500000000099",
      name: "Botana Salada 50g",
      salePrice: 70,
      finalPrice: 70,
      costPrice: 35,
      stock: 18,
      currentStock: 18,
      minStock: 4,
    }),
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

function resolveMockCategory(
  categories: Array<{ id: string; name: string }>,
  payload: { categoryId?: string | null; categoryName?: string | null },
) {
  const categoryName = String(payload.categoryName ?? "").trim();

  if (categoryName) {
    const existingCategory = categories.find(
      (category) => category.name.toLowerCase() === categoryName.toLowerCase(),
    );

    if (existingCategory) return existingCategory;

    const createdCategory = {
      id: `category-${categories.length + 1}`,
      name: categoryName,
    };

    categories.push(createdCategory);

    return createdCategory;
  }

  if (payload.categoryId === null) return null;

  return categories.find((category) => category.id === payload.categoryId) ?? {
    id: "category-1",
    name: "Bebidas",
  };
}

function buildCreatedProduct(
  payload: Partial<MockProduct> & {
    categoryId?: string | null;
    categoryName?: string | null;
    initialStock?: number;
  },
  sequence: number,
  categories: Array<{ id: string; name: string }>,
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
    category: resolveMockCategory(categories, payload),
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
  payload: Partial<MockProduct> & {
    categoryId?: string | null;
    categoryName?: string | null;
  },
  categories: Array<{ id: string; name: string }>,
) {
  const salePrice = Number(payload.salePrice ?? product.salePrice);
  const promoPercent = Number(payload.promoPercent ?? product.promoPercent);
  const costPrice = Number(payload.costPrice ?? product.costPrice ?? 0);

  product.sku = String(payload.sku ?? product.sku);
  product.barcode = payload.barcode ? String(payload.barcode) : null;
  product.name = String(payload.name ?? product.name);
  product.description = payload.description ? String(payload.description) : null;
  if (payload.categoryName !== undefined || payload.categoryId !== undefined) {
    product.category = resolveMockCategory(categories, payload);
  }
  product.salePrice = salePrice;
  product.promoPercent = promoPercent;
  product.finalPrice = Number((salePrice * (1 - promoPercent / 100)).toFixed(2));
  product.costPrice = costPrice;
  product.minStock = Number(payload.minStock ?? product.minStock ?? 0);
  product.marginPercent = salePrice > 0
    ? Number((((salePrice - costPrice) / salePrice) * 100).toFixed(2))
    : 0;
}

function inventoryStockResponse(
  products: MockProduct[],
  warehouses: MockWarehouse[],
  balances: MockInventoryBalanceMap,
  query: string | null,
) {
  const normalizedQuery = normalize(query);

  return products
    .filter((product) => matchesProduct(product, normalizedQuery))
    .map((product) => {
      const productBalances = balances.get(product.id) ?? new Map<string, number>();
      const locations = [...productBalances.entries()]
        .map(([warehouseId, quantity]) => {
          const warehouse = warehouses.find((item) => item.id === warehouseId);

          return {
            warehouseId,
            warehouseName: warehouse?.name ?? "Principal",
            warehouseType: warehouse?.type ?? "STORAGE",
            sellerId: warehouse?.sellerId ?? null,
            quantity,
          };
        });

      return {
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
        locations,
      };
    });
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
    warehouse?: { id: string; name: string };
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
    warehouse: input.warehouse ?? {
      id: "warehouse-1",
      name: "Principal",
    },
  };
}

const expirationMovementSearchTerms = [
  "caducidad",
  "merma",
  "merma economica",
  "expiration",
  "expired",
  "vencimiento",
  "vencido",
];

function matchesExpirationMovementSearch(query: string) {
  return expirationMovementSearchTerms.some((term) => {
    const normalizedTerm = normalize(term);

    return normalizedTerm.includes(query) || query.includes(normalizedTerm);
  });
}

function filterMovements(movements: MockInventoryMovement[], query: string | null) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return movements;

  return movements.filter((movement) => {
    const searchableValues = [
      movement.type,
      movement.reason,
      movement.reasonType,
      movement.productSku,
      movement.productName,
      movement.warehouse?.name,
    ];

    return (
      searchableValues.some((value) => normalize(value).includes(normalizedQuery)) ||
      (movement.reasonType === "EXPIRATION" && matchesExpirationMovementSearch(normalizedQuery))
    );
  });
}



function inventoryTransferRequestsResponse(
  role: Role,
  users: MockManagedUser[],
  warehouses: MockWarehouse[],
  products: MockProduct[],
): MockInventoryTransferRequest[] {
  const seller = users.find((item) => item.role === "CASHIER") ?? users[1];
  const sellerWarehouse = ensureMockSellerWarehouse(warehouses, seller);
  const request = buildInventoryTransferRequest({
    id: "transfer-1",
    fromWarehouse: warehouses[0],
    product: products[0],
    quantity: 4,
    reason: "Surtir ruta de ventas E2E",
    requestedBy: seller,
    status: "PENDING",
    toWarehouse: sellerWarehouse,
  });

  return role === "ADMIN" ? [request] : [];
}

function buildInventoryTransferRequest({
  fromWarehouse,
  id,
  product,
  quantity,
  reason,
  requestedBy,
  status,
  toWarehouse,
}: {
  fromWarehouse: MockWarehouse;
  id: string;
  product: MockProduct;
  quantity: number;
  reason: string;
  requestedBy: MockManagedUser;
  status: MockInventoryTransferRequest["status"];
  toWarehouse: MockWarehouse;
}): MockInventoryTransferRequest {
  return {
    id,
    status,
    reason,
    reviewNote: null,
    createdAt: "2026-06-05T18:00:00.000Z",
    updatedAt: "2026-06-05T18:00:00.000Z",
    reviewedAt: null,
    fromWarehouse,
    toWarehouse,
    requestedBy,
    reviewedBy: null,
    totalUnits: quantity,
    items: [
      {
        id: `${id}-item-1`,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity,
      },
    ],
  };
}

function ensureMockSellerWarehouse(
  warehouses: MockWarehouse[],
  seller: MockManagedUser,
) {
  const existingWarehouse = warehouses.find((warehouse) => warehouse.sellerId === seller.id);

  if (existingWarehouse) {
    return existingWarehouse;
  }

  const warehouse: MockWarehouse = {
    id: `seller-warehouse-${seller.id}`,
    name: `Stock de ${seller.name}`,
    description: "Stock físico asignado al vendedor",
    type: "SELLER",
    sellerId: seller.id,
    isActive: true,
  };

  warehouses.push(warehouse);

  return warehouse;
}

function filterInventoryTransferRequests(
  requests: MockInventoryTransferRequest[],
  role: Role,
  status: string | null,
) {
  return requests.filter((request) => {
    const matchesStatus = !status || request.status === status;
    const matchesRole = role === "ADMIN" || request.requestedBy.id === "seller-e2e";

    return matchesStatus && matchesRole;
  });
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
    inventory: {
      movements: {
        count: 3,
        unitsIn: 42,
        unitsOut: 6,
        byType: {
          IN: 42,
          OUT: 6,
        },
        byReasonType: {
          EXPIRATION: 4,
          OTHER: 2,
        },
        latest: [
          {
            id: "inventory-movement-expiration-e2e",
            type: "OUT",
            reasonType: "EXPIRATION",
            reason: "Caducidad detectada en almacén",
            quantity: 4,
            unitCostAtMovement: 12,
            costAmount: 48,
            product: {
              id: "product-1",
              sku: "COCA-600",
              name: "Coca-Cola 600 ml",
            },
            warehouse: {
              id: "warehouse-1",
              name: "Principal",
            },
            createdAt: "2026-05-22T09:30:00.000Z",
          },
        ],
      },
      shrinkage: {
        totalUnits: 4,
        totalCost: 48,
        byProduct: [
          {
            product: {
              id: "product-1",
              sku: "COCA-600",
              name: "Coca-Cola 600 ml",
            },
            quantity: 4,
            cost: 48,
          },
        ],
        byWarehouse: [
          {
            warehouse: {
              id: "warehouse-1",
              name: "Principal",
            },
            quantity: 4,
            cost: 48,
          },
        ],
        latest: [
          {
            id: "inventory-movement-expiration-e2e",
            type: "OUT",
            reasonType: "EXPIRATION",
            reason: "Caducidad detectada en almacén",
            quantity: 4,
            unitCostAtMovement: 12,
            costAmount: 48,
            product: {
              id: "product-1",
              sku: "COCA-600",
              name: "Coca-Cola 600 ml",
            },
            warehouse: {
              id: "warehouse-1",
              name: "Principal",
            },
            createdAt: "2026-05-22T09:30:00.000Z",
          },
        ],
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

function userToManagedUser(user: MockUser): MockManagedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: true,
    createdAt: "2026-05-20T09:00:00.000Z",
  };
}

function saleSummaryForAdjustmentRequest(sale: MockSale): MockSaleAdjustmentRequest["sale"] {
  return {
    id: sale.id,
    folio: sale.folio,
    status: sale.status,
    total: sale.total,
    createdAt: sale.createdAt,
    cashier: sale.cashier,
  };
}

function buildAdjustmentRequest(input: {
  id: string;
  sale: MockSale;
  requestedBy: MockManagedUser;
  type: "CANCEL_SALE" | "RETURN_ITEMS";
  reason: string;
  refundMethod?: string | null;
  items?: Array<{ saleItemId: string; quantity: number }>;
}): MockSaleAdjustmentRequest {
  const items = (input.items ?? []).map((item, index) => {
    const saleItem = input.sale.items.find((candidate) => candidate.id === item.saleItemId);

    return {
      id: `${input.id}-item-${index + 1}`,
      saleItemId: item.saleItemId,
      productId: saleItem?.productId,
      productSku: saleItem?.productSku ?? saleItem?.product?.sku,
      productName: saleItem?.productName ?? saleItem?.product?.name,
      quantity: item.quantity,
      saleItem: saleItem
        ? {
            id: saleItem.id,
            quantity: saleItem.quantity,
            productSku: saleItem.productSku,
            productName: saleItem.productName,
          }
        : undefined,
      product: saleItem?.product ?? null,
    };
  });

  return {
    id: input.id,
    type: input.type,
    status: "PENDING",
    saleId: input.sale.id,
    requestedById: input.requestedBy.id,
    reviewedById: null,
    reason: input.reason,
    refundMethod: input.refundMethod ?? null,
    reviewNote: null,
    createdAt: "2026-05-22T13:45:00.000Z",
    reviewedAt: null,
    sale: saleSummaryForAdjustmentRequest(input.sale),
    requestedBy: input.requestedBy,
    reviewedBy: null,
    items,
  };
}

function adjustmentRequestsResponse(
  role: Role,
  sales: MockSale[],
  managedUsers: MockManagedUser[],
): MockSaleAdjustmentRequest[] {
  if (role !== "ADMIN") {
    return [];
  }

  const sale = sales[0];
  const seller = managedUsers.find((item) => item.role === "CASHIER") ?? managedUsers[0];

  return [
    buildAdjustmentRequest({
      id: "adjustment-1",
      sale,
      requestedBy: seller,
      type: "RETURN_ITEMS",
      reason: "Cliente reportó producto dañado",
      refundMethod: "CASH",
      items: [{ saleItemId: sale.items[0].id, quantity: 1 }],
    }),
  ];
}

function applyApprovedAdjustmentRequest(request: MockSaleAdjustmentRequest, sales: MockSale[]) {
  const sale = sales.find((item) => item.id === request.saleId);

  if (!sale) return;

  if (request.type === "CANCEL_SALE") {
    sale.status = "CANCELLED";
    request.sale = saleSummaryForAdjustmentRequest(sale);
    return;
  }

  const returnItems = request.items.map((item) => {
    const saleItem = sale.items.find((candidate) => candidate.id === item.saleItemId);
    const unitTotal = saleItem ? Number(saleItem.total) / Number(saleItem.quantity) : 0;

    return {
      id: `return-item-${item.id}`,
      saleItemId: item.saleItemId,
      productId: item.productId,
      productSku: item.productSku,
      productName: item.productName,
      quantity: item.quantity,
      total: Number((unitTotal * item.quantity).toFixed(2)),
    };
  });

  const refundTotal = returnItems.reduce((sum, item) => sum + item.total, 0);

  sale.returns = [
    {
      id: `return-${request.id}`,
      reason: request.reason,
      refundMethod: request.refundMethod ?? "CASH",
      refundTotal,
      createdAt: "2026-05-22T14:00:00.000Z",
      items: returnItems,
    },
    ...(sale.returns ?? []),
  ];

  const allReturned = sale.items.every((saleItem) => {
    const returnedQuantity = sale.returns.reduce((sum, saleReturn) => {
      return sum + saleReturn.items.reduce((itemSum, item) => {
        return item.saleItemId === saleItem.id ? itemSum + item.quantity : itemSum;
      }, 0);
    }, 0);

    return returnedQuantity >= saleItem.quantity;
  });

  sale.status = allReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";
  request.sale = saleSummaryForAdjustmentRequest(sale);
}

function salesResponse(role: Role): MockSale[] {
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
      items: role === "ADMIN"
        ? [
            {
              id: "sale-item-1",
              productId: "product-1",
              productSku: "COCA-600",
              productName: "Coca-Cola 600 ml",
              quantity: 1,
              unitPrice: 180,
              discount: 0,
              total: 180,
              product: {
                id: "product-1",
                sku: "COCA-600",
                name: "Coca-Cola 600 ml",
              },
            },
            {
              id: "sale-item-2",
              productId: "product-2",
              productSku: "BOTANA-50G",
              productName: "Botana Salada 50g",
              quantity: 2,
              unitPrice: 70,
              discount: 0,
              total: 140,
              product: {
                id: "product-2",
                sku: "BOTANA-50G",
                name: "Botana Salada 50g",
              },
            },
          ]
        : [
            {
              id: "sale-item-1",
              productId: "product-1",
              productSku: "COCA-600",
              productName: "Coca-Cola 600 ml",
              quantity: 1,
              unitPrice: 180,
              discount: 0,
              total: 180,
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
): MockSale {
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
