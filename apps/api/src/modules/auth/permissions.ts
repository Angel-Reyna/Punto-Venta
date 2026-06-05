import { Role } from "@prisma/client";

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

const ADMIN_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

const CASHIER_PERMISSIONS = [
  PERMISSIONS.ProductsRead,
  PERMISSIONS.InventoryRead,
  PERMISSIONS.InventoryTransferRequestRead,
  PERMISSIONS.InventoryTransferRequestCreate,
  PERMISSIONS.SalesRead,
  PERMISSIONS.SalesCreate,
  PERMISSIONS.SalesAdjustmentRequestRead,
  PERMISSIONS.SalesAdjustmentRequestCreate,
  PERMISSIONS.DashboardRead
] as const satisfies readonly Permission[];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.ADMIN]: ADMIN_PERMISSIONS,
  [Role.CASHIER]: CASHIER_PERMISSIONS
};

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAllPermissions(
  role: Role,
  permissions: readonly Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
