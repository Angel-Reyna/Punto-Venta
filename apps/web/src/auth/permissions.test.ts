import { describe, expect, it } from "vitest";

import { hasPermission, normalizePermissions, PERMISSIONS } from "./permissions";

describe("frontend permissions", () => {
  it("normalizes server-issued permissions defensively", () => {
    expect(
      normalizePermissions([
        PERMISSIONS.ProductsRead,
        PERMISSIONS.ProductsRead,
        "unknown:permission",
        PERMISSIONS.SalesCreate,
        123 as unknown as string
      ])
    ).toEqual([PERMISSIONS.ProductsRead, PERMISSIONS.SalesCreate]);
  });

  it("returns an empty permission list when the server payload is absent or invalid", () => {
    expect(normalizePermissions(undefined)).toEqual([]);
    expect(normalizePermissions(null)).toEqual([]);
    expect(normalizePermissions("users:read" as unknown as string[])).toEqual([]);
  });

  it("checks permissions from the normalized list only", () => {
    const permissions = normalizePermissions([
      PERMISSIONS.ProductsRead,
      PERMISSIONS.SalesCreate
    ]);

    expect(hasPermission(permissions, PERMISSIONS.ProductsRead)).toBe(true);
    expect(hasPermission(permissions, PERMISSIONS.SalesCreate)).toBe(true);
    expect(hasPermission(permissions, PERMISSIONS.UsersRead)).toBe(false);
  });

  it("normalizes sales adjustment permissions issued by the API", () => {
    const permissions = normalizePermissions([
      PERMISSIONS.SalesAdjustmentRequestRead,
      PERMISSIONS.SalesAdjustmentRequestCreate,
      PERMISSIONS.SalesAdjustmentRequestReview,
      "sales-adjustments:legacy"
    ]);

    expect(hasPermission(permissions, PERMISSIONS.SalesAdjustmentRequestRead)).toBe(true);
    expect(hasPermission(permissions, PERMISSIONS.SalesAdjustmentRequestCreate)).toBe(true);
    expect(hasPermission(permissions, PERMISSIONS.SalesAdjustmentRequestReview)).toBe(true);
    expect(permissions).not.toContain("sales-adjustments:legacy");
  });


  it("normalizes inventory transfer request permissions issued by the API", () => {
    const permissions = normalizePermissions([
      PERMISSIONS.InventoryTransferRequestRead,
      PERMISSIONS.InventoryTransferRequestCreate,
      PERMISSIONS.InventoryTransferRequestReview,
      "inventory-transfer-requests:legacy"
    ]);

    expect(hasPermission(permissions, PERMISSIONS.InventoryTransferRequestRead)).toBe(true);
    expect(hasPermission(permissions, PERMISSIONS.InventoryTransferRequestCreate)).toBe(true);
    expect(hasPermission(permissions, PERMISSIONS.InventoryTransferRequestReview)).toBe(true);
    expect(permissions).not.toContain("inventory-transfer-requests:legacy");
  });

});
