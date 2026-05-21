import { describe, expect, it } from "vitest";

import { PERMISSIONS, type Permission } from "../auth/permissions";
import {
  buildNavigationSections,
  buildPrimaryNavigationAction,
  flattenNavigationSections,
  getVisibleNavigationSections,
  isNavigationRouteActive
} from "./navigation";

function canFrom(permissions: readonly Permission[]) {
  return (permission: Permission) => permissions.includes(permission);
}

const ADMIN_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];
const CASHIER_PERMISSIONS = [
  PERMISSIONS.DashboardRead,
  PERMISSIONS.ProductsRead,
  PERMISSIONS.InventoryRead,
  PERMISSIONS.SalesRead,
  PERMISSIONS.SalesCreate
] as const satisfies readonly Permission[];

describe("navigation visibility", () => {
  it("shows admin control and administration routes only when permissions are present", () => {
    const visibleItems = flattenNavigationSections(
      getVisibleNavigationSections(buildNavigationSections(canFrom(ADMIN_PERMISSIONS)))
    );

    const visiblePaths = visibleItems.map((item) => item.to);

    expect(visiblePaths).toEqual(
      expect.arrayContaining([
        "/",
        "/products",
        "/inventory",
        "/users",
        "/seller-activity",
        "/reports",
        "/audit"
      ])
    );
    expect(visiblePaths).not.toContain("/cash-register");
  });

  it("hides admin-only routes for cashiers", () => {
    const visibleItems = flattenNavigationSections(
      getVisibleNavigationSections(buildNavigationSections(canFrom(CASHIER_PERMISSIONS)))
    );

    expect(visibleItems.map((item) => item.to)).toEqual([
      "/",
      "/products",
      "/inventory"
    ]);
  });

  it("shows the primary sales action only when sales read and create permissions exist", () => {
    expect(buildPrimaryNavigationAction(canFrom(CASHIER_PERMISSIONS))).toEqual(
      expect.objectContaining({
        label: "Nueva venta",
        to: "/sales"
      })
    );

    expect(
      buildPrimaryNavigationAction(
        canFrom([PERMISSIONS.SalesCreate, PERMISSIONS.ProductsRead])
      )
    ).toBeNull();
  });

  it("marks nested routes as active without making root active for every path", () => {
    expect(isNavigationRouteActive("/", "/")).toBe(true);
    expect(isNavigationRouteActive("/products", "/")).toBe(false);
    expect(isNavigationRouteActive("/products/123", "/products")).toBe(true);
    expect(isNavigationRouteActive("/productivity", "/products")).toBe(false);
  });
});
