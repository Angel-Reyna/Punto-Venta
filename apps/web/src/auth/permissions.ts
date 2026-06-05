export const PERMISSIONS = {
  UsersRead: "users:read",
  UsersCreate: "users:create",
  UsersToggleActive: "users:toggle-active",
  UsersUpdateRole: "users:update-role",
  UsersResetPassword: "users:reset-password",

  ProductsRead: "products:read",
  ProductsCreate: "products:create",
  ProductsUpdate: "products:update",
  ProductsToggleActive: "products:toggle-active",
  ProductsDelete: "products:delete",
  ProductsImport: "products:import",

  InventoryRead: "inventory:read",
  InventoryAdjust: "inventory:adjust",
  InventoryTransferRequestRead: "inventory-transfer-requests:read",
  InventoryTransferRequestCreate: "inventory-transfer-requests:create",
  InventoryTransferRequestReview: "inventory-transfer-requests:review",

  SalesRead: "sales:read",
  SalesCreate: "sales:create",
  SalesCancel: "sales:cancel",
  SalesReturn: "sales:return",
  SalesAdjustmentRequestRead: "sales-adjustments:read",
  SalesAdjustmentRequestCreate: "sales-adjustments:create",
  SalesAdjustmentRequestReview: "sales-adjustments:review",

  ReportsRead: "reports:read",
  DashboardRead: "dashboard:read",
  AuditRead: "audit:read",
  SellerActivityRead: "seller-activity:read"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type Role = "ADMIN" | "CASHIER";

const PERMISSION_VALUES = new Set<Permission>(
  Object.values(PERMISSIONS) as Permission[]
);

export function normalizePermissions(
  permissions: readonly string[] | null | undefined
): Permission[] {
  if (!Array.isArray(permissions)) {
    return [];
  }

  const normalizedPermissions = new Set<Permission>();

  for (const permission of permissions) {
    if (typeof permission !== "string") {
      continue;
    }

    if (PERMISSION_VALUES.has(permission as Permission)) {
      normalizedPermissions.add(permission as Permission);
    }
  }

  return [...normalizedPermissions];
}

export function hasPermission(
  permissions: readonly Permission[] | null | undefined,
  permission: Permission
) {
  return Boolean(permissions?.includes(permission));
}
