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

function createRequest(userRole: Role) {
  return {
    user: {
      id: "seller-1",
      email: "seller@pos.local",
      role: userRole
    },
    method: "POST",
    originalUrl: "/api/users",
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

});
