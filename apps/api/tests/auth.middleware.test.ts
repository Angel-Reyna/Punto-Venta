import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

const sellerActivityMock = {
  logSellerActivity: jest.fn(),
  shouldLogSellerActivity: jest.fn((user?: { role: Role }) => user?.role === Role.CASHIER)
};

jest.mock("../src/modules/seller-activity/seller-activity.service", () => sellerActivityMock);

jest.mock("../src/modules/auth/auth.tokens", () => ({
  verifyAccessToken: jest.fn()
}));

import { requirePermission, requireRole } from "../src/middlewares/auth";
import { PERMISSIONS } from "../src/modules/auth/permissions";

function createRequest(userRole: Role, originalUrl = "/api/users") {
  return {
    user: {
      id: "seller-1",
      email: "seller@pos.local",
      role: userRole
    },
    method: "POST",
    originalUrl,
    ip: "127.0.0.1",
    headers: {
      "user-agent": "jest"
    }
  } as unknown as Request;
}

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs failed authorization attempts for cashiers", () => {
    const req = createRequest(Role.CASHIER);
    const next = jest.fn() as NextFunction;
    const middleware = requireRole(Role.ADMIN);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith({
      sellerId: "seller-1",
      action: "FAILED_ACCESS_ATTEMPT",
      entityType: "Route",
      entityId: "/api/users",
      description: "Intento no autorizado a POST /api/users",
      metadata: {
        method: "POST",
        path: "/api/users",
        requiredRoles: [Role.ADMIN]
      },
      ipAddress: "127.0.0.1",
      userAgent: "jest"
    });
  });

  it("does not log failed authorization attempts for admins when role matches", () => {
    const req = createRequest(Role.ADMIN);
    const next = jest.fn() as NextFunction;
    const middleware = requireRole(Role.ADMIN);

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(sellerActivityMock.logSellerActivity).not.toHaveBeenCalled();
  });

  it("allows admins when the required permission is granted", () => {
    const req = createRequest(Role.ADMIN);
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.UsersRead);

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(sellerActivityMock.logSellerActivity).not.toHaveBeenCalled();
  });

  it("logs failed authorization attempts when a permission is missing", () => {
    const req = createRequest(Role.CASHIER);
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.UsersRead);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith({
      sellerId: "seller-1",
      action: "FAILED_ACCESS_ATTEMPT",
      entityType: "Route",
      entityId: "/api/users",
      description: "Intento no autorizado a POST /api/users",
      metadata: {
        method: "POST",
        path: "/api/users",
        requiredPermissions: [PERMISSIONS.UsersRead]
      },
      ipAddress: "127.0.0.1",
      userAgent: "jest"
    });
  });

  it("denies cashier product mutation permissions", () => {
    const req = createRequest(Role.CASHIER, "/api/products/import/excel");
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.ProductsImport);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          method: "POST",
          path: "/api/products/import/excel",
          requiredPermissions: [PERMISSIONS.ProductsImport]
        }
      })
    );
  });

  it("denies cashier inventory adjustment permissions but keeps failed attempt auditable", () => {
    const req = createRequest(Role.CASHIER, "/api/inventory/in");
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.InventoryAdjust);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          method: "POST",
          path: "/api/inventory/in",
          requiredPermissions: [PERMISSIONS.InventoryAdjust]
        }
      })
    );
  });

  it("denies cashier sale cancellation permissions but keeps failed attempt auditable", () => {
    const req = createRequest(Role.CASHIER, "/api/sales/sale-1/cancel");
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.SalesCancel);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          method: "POST",
          path: "/api/sales/sale-1/cancel",
          requiredPermissions: [PERMISSIONS.SalesCancel]
        }
      })
    );
  });

  it("denies cashier sale return permissions but keeps failed attempt auditable", () => {
    const req = createRequest(Role.CASHIER, "/api/sales/sale-1/returns");
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.SalesReturn);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          method: "POST",
          path: "/api/sales/sale-1/returns",
          requiredPermissions: [PERMISSIONS.SalesReturn]
        }
      })
    );
  });

  it("denies cashier manual cash movement permissions but keeps failed attempt auditable", () => {
    const req = createRequest(Role.CASHIER, "/api/cash-register/movements");
    const next = jest.fn() as NextFunction;
    const middleware = requirePermission(PERMISSIONS.CashRegisterManage);

    expect(() => middleware(req, {} as Response, next)).toThrow("No autorizado");

    expect(next).not.toHaveBeenCalled();
    expect(sellerActivityMock.logSellerActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          method: "POST",
          path: "/api/cash-register/movements",
          requiredPermissions: [PERMISSIONS.CashRegisterManage]
        }
      })
    );
  });

});
