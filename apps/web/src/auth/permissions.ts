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

  SalesRead: "sales:read",
  SalesCreate: "sales:create",
  SalesCancel: "sales:cancel",
  SalesReturn: "sales:return",

  CashRegisterRead: "cash-register:read",
  CashRegisterOperate: "cash-register:operate",
  CashRegisterManage: "cash-register:manage",

  ReportsRead: "reports:read",
  DashboardRead: "dashboard:read",
  AuditRead: "audit:read",
  SellerActivityRead: "seller-activity:read"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type Role = "ADMIN" | "CASHIER";

const ADMIN_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

const CASHIER_PERMISSIONS = [
  PERMISSIONS.ProductsRead,
  PERMISSIONS.InventoryRead,
  PERMISSIONS.SalesRead,
  PERMISSIONS.SalesCreate,
  PERMISSIONS.CashRegisterOperate,
  PERMISSIONS.DashboardRead
] as const satisfies readonly Permission[];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  CASHIER: CASHIER_PERMISSIONS
};

export function getPermissionsForRole(role?: Role | null): readonly Permission[] {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}

export function hasPermission(role: Role | null | undefined, permission: Permission) {
  return getPermissionsForRole(role).includes(permission);
}
