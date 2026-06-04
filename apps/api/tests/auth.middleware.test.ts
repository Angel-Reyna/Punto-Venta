import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

const prismaMock = {
  user: {
    findUnique: jest.fn()
  }
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

const sellerActivityMock = {
  logSellerActivity: jest.fn(),
  shouldLogSellerActivity: jest.fn((user?: { role: Role }) => user?.role === Role.CASHIER)
};

jest.mock("../src/modules/seller-activity/seller-activity.service", () => sellerActivityMock);

const authTokensMock = {
  verifyAccessToken: jest.fn()
};

jest.mock("../src/modules/auth/auth.tokens", () => authTokensMock);

import { requireAuth, requirePermission, requireRole } from "../src/middlewares/auth";
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
      authorization: "Bearer access-token",
      "user-agent": "jest"
    }
  } as unknown as Request;
}

function waitForAsyncMiddleware() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authTokensMock.verifyAccessToken.mockReturnValue({
      sub: "seller-1",
      email: "old-email@pos.local",
      role: Role.ADMIN,
      type: "access"
    });
  });

  it("hydrates the authenticated user from the database instead of trusting stale token claims", async () => {
    const req = createRequest(Role.ADMIN);
    req.user = undefined;
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue({
      id: "seller-1",
      email: "seller@pos.local",
      role: Role.CASHIER,
      isActive: true
    });

    requireAuth(req, {} as Response, next);
    await waitForAsyncMiddleware();

    expect(authTokensMock.verifyAccessToken).toHaveBeenCalledWith("access-token");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: "seller-1"
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    expect(req.user).toEqual({
      id: "seller-1",
      email: "seller@pos.local",
      role: Role.CASHIER
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects inactive users even when the access token is still valid", async () => {
    const req = createRequest(Role.ADMIN);
    req.user = undefined;
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue({
      id: "seller-1",
      email: "seller@pos.local",
      role: Role.ADMIN,
      isActive: false
    });

    requireAuth(req, {} as Response, next);
    await waitForAsyncMiddleware();

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Usuario inactivo"
      })
    );
  });

  it("rejects users removed from the database", async () => {
    const req = createRequest(Role.ADMIN);
    req.user = undefined;
    const next = jest.fn() as NextFunction;

    prismaMock.user.findUnique.mockResolvedValue(null);

    requireAuth(req, {} as Response, next);
    await waitForAsyncMiddleware();

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Usuario no encontrado"
      })
    );
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

});
