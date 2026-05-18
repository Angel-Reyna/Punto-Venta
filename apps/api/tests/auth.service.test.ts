import bcrypt from "bcrypt";

import { AppError } from "../src/utils/AppError";

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  refreshSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  },
  $transaction: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

const authTokensMock = {
  signAccessToken: jest.fn(() => "access-token"),
  signRefreshToken: jest.fn(() => "refresh-token"),
  verifyRefreshToken: jest.fn()
};

jest.mock("../src/modules/auth/auth.tokens", () => authTokensMock);

const tokenHashMock = {
  hashToken: jest.fn((token: string) => `hash:${token}`),
  safeCompareHash: jest.fn((left: string, right: string) => left === right)
};

jest.mock("../src/modules/auth/token-hash", () => tokenHashMock);

import {
  login,
  refreshSession,
  registerCashier
} from "../src/modules/auth/auth.service";

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const activeAdmin = {
  id: "user-1",
  name: "Administrador",
  email: "admin@pos.local",
  passwordHash: "stored-password-hash",
  role: "ADMIN",
  isActive: true
};

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: unknown[]) => operations);
  });

  describe("login", () => {
    it("normalizes email, validates password and creates a refresh session", async () => {
      prismaMock.user.findUnique.mockResolvedValue(activeAdmin);
      bcryptMock.compare.mockResolvedValue(true as never);

      const result = await login(
        {
          email: "  ADMIN@POS.LOCAL  ",
          password: "Admin12345"
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "jest"
        }
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "admin@pos.local"
        }
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        "Admin12345",
        "stored-password-hash"
      );
      expect(authTokensMock.signRefreshToken).toHaveBeenCalledWith(
        "user-1",
        expect.any(String)
      );
      expect(prismaMock.refreshSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          tokenHash: "hash:refresh-token",
          ipAddress: "127.0.0.1",
          userAgent: "jest",
          expiresAt: expect.any(Date)
        })
      });
      expect(result).toEqual({
        user: {
          id: "user-1",
          name: "Administrador",
          email: "admin@pos.local",
          role: "ADMIN"
        },
        accessToken: "access-token",
        refreshToken: "refresh-token"
      });
    });

    it("rejects missing or inactive users without revealing which condition failed", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        login({ email: "missing@pos.local", password: "Admin12345" }, {})
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Credenciales inválidas"
      } satisfies Partial<AppError>);

      prismaMock.user.findUnique.mockResolvedValue({
        ...activeAdmin,
        isActive: false
      });

      await expect(
        login({ email: "admin@pos.local", password: "Admin12345" }, {})
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Credenciales inválidas"
      } satisfies Partial<AppError>);
    });

    it("rejects invalid passwords", async () => {
      prismaMock.user.findUnique.mockResolvedValue(activeAdmin);
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(
        login({ email: "admin@pos.local", password: "wrong-password" }, {})
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Credenciales inválidas"
      } satisfies Partial<AppError>);

      expect(prismaMock.refreshSession.create).not.toHaveBeenCalled();
    });
  });

  describe("refreshSession", () => {
    it("rotates refresh sessions and revokes the previous session", async () => {
      authTokensMock.verifyRefreshToken.mockReturnValue({
        sub: "user-1",
        sessionId: "session-1",
        type: "refresh"
      });
      tokenHashMock.hashToken.mockImplementation((token: string) =>
        token === "current-refresh-token" ? "incoming-hash" : "next-hash"
      );
      tokenHashMock.safeCompareHash.mockReturnValue(true);
      authTokensMock.signRefreshToken.mockReturnValue("next-refresh-token");
      prismaMock.refreshSession.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        tokenHash: "stored-hash",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: activeAdmin
      });

      const result = await refreshSession("current-refresh-token", {
        ipAddress: "127.0.0.1",
        userAgent: "jest"
      });

      expect(prismaMock.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({}),
        expect.objectContaining({})
      ]);
      expect(prismaMock.refreshSession.update).toHaveBeenCalledWith({
        where: {
          id: "session-1"
        },
        data: {
          revokedAt: expect.any(Date),
          replacedBySessionId: expect.any(String)
        }
      });
      expect(prismaMock.refreshSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          tokenHash: "next-hash",
          ipAddress: "127.0.0.1",
          userAgent: "jest",
          expiresAt: expect.any(Date)
        })
      });
      expect(result.refreshToken).toBe("next-refresh-token");
      expect(result.accessToken).toBe("access-token");
    });

    it("revokes active sessions when token hash does not match", async () => {
      authTokensMock.verifyRefreshToken.mockReturnValue({
        sub: "user-1",
        sessionId: "session-1",
        type: "refresh"
      });
      tokenHashMock.safeCompareHash.mockReturnValue(false);
      prismaMock.refreshSession.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        tokenHash: "stored-hash",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: activeAdmin
      });

      await expect(refreshSession("reused-token", {})).rejects.toMatchObject({
        statusCode: 401
      } satisfies Partial<AppError>);

      expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          revokedAt: null
        },
        data: {
          revokedAt: expect.any(Date)
        }
      });
      expect(prismaMock.refreshSession.create).not.toHaveBeenCalled();
    });
  });

  describe("registerCashier", () => {
    it("normalizes user input, hashes the password and creates an active cashier", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue("new-password-hash" as never);
      prismaMock.user.create.mockResolvedValue({
        id: "cashier-1",
        name: "Ana Cajera",
        email: "ana@pos.local",
        role: "CASHIER",
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z")
      });

      const result = await registerCashier(
        "  Ana Cajera  ",
        "  ANA@POS.LOCAL  ",
        "Cajera123"
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "ana@pos.local"
        }
      });
      expect(bcryptMock.hash).toHaveBeenCalledWith("Cajera123", 4);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: "Ana Cajera",
            email: "ana@pos.local",
            passwordHash: "new-password-hash",
            role: "CASHIER",
            isActive: true
          }
        })
      );
      expect(result.email).toBe("ana@pos.local");
    });

    it("rejects duplicate emails", async () => {
      prismaMock.user.findUnique.mockResolvedValue(activeAdmin);

      await expect(
        registerCashier("Admin", "admin@pos.local", "Admin12345")
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "El correo ya está registrado"
      } satisfies Partial<AppError>);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
});
