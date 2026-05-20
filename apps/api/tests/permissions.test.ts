import { Role } from "@prisma/client";

import {
  getPermissionsForRole,
  hasAllPermissions,
  hasPermission,
  PERMISSIONS
} from "../src/modules/auth/permissions";

describe("permissions", () => {
  it("grants every declared permission to admins", () => {
    expect(getPermissionsForRole(Role.ADMIN)).toEqual(
      expect.arrayContaining(Object.values(PERMISSIONS))
    );
  });

  it("keeps user administration permissions restricted to admins", () => {
    expect(hasPermission(Role.ADMIN, PERMISSIONS.UsersRead)).toBe(true);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.UsersRead)).toBe(false);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.UsersUpdateRole)).toBe(false);
  });

  it("keeps product mutation permissions restricted to admins", () => {
    expect(hasPermission(Role.ADMIN, PERMISSIONS.ProductsCreate)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.ProductsUpdate)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.ProductsToggleActive)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.ProductsImport)).toBe(true);

    expect(hasPermission(Role.CASHIER, PERMISSIONS.ProductsRead)).toBe(true);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.ProductsCreate)).toBe(false);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.ProductsUpdate)).toBe(false);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.ProductsToggleActive)).toBe(false);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.ProductsImport)).toBe(false);
  });

  it("keeps inventory adjustments restricted to admins while allowing stock reads to cashiers", () => {
    expect(hasPermission(Role.ADMIN, PERMISSIONS.InventoryRead)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.InventoryAdjust)).toBe(true);

    expect(hasPermission(Role.CASHIER, PERMISSIONS.InventoryRead)).toBe(true);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.InventoryAdjust)).toBe(false);
  });

  it("allows cashiers to read and create sales while keeping cancel and return restricted", () => {
    expect(hasPermission(Role.ADMIN, PERMISSIONS.SalesRead)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.SalesCreate)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.SalesCancel)).toBe(true);
    expect(hasPermission(Role.ADMIN, PERMISSIONS.SalesReturn)).toBe(true);

    expect(hasPermission(Role.CASHIER, PERMISSIONS.SalesRead)).toBe(true);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.SalesCreate)).toBe(true);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.SalesCancel)).toBe(false);
    expect(hasPermission(Role.CASHIER, PERMISSIONS.SalesReturn)).toBe(false);
  });

  it("grants operational POS permissions to cashiers", () => {
    expect(hasAllPermissions(Role.CASHIER, [
      PERMISSIONS.ProductsRead,
      PERMISSIONS.InventoryRead,
      PERMISSIONS.SalesRead,
      PERMISSIONS.SalesCreate,
      PERMISSIONS.CashRegisterOperate
    ])).toBe(true);
  });
});
