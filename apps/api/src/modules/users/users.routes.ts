import { Router } from "express";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";
import { env } from "../../config/env";

import { requireAuth, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { auditLog } from "../audit/audit.service";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no debe superar 72 caracteres")
  .regex(/[A-Z]/, "La contraseña debe incluir una mayúscula")
  .regex(/[a-z]/, "La contraseña debe incluir una minúscula")
  .regex(/[0-9]/, "La contraseña debe incluir un número");

const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(255),
    password: passwordSchema,
    role: z.nativeEnum(Role)
  })
});

const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    role: z.nativeEnum(Role)
  })
});

const resetUserPasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    password: passwordSchema
  })
});

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(Role.ADMIN));

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json(users);
  })
);

usersRouter.post(
  "/",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: req.body.email
      }
    });

    if (existingUser) {
      throw new AppError(409, "El correo ya está registrado");
    }

    const passwordHash = await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        role: req.body.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    await auditLog({
      userId: req.user?.id,
      action: "CREATE_USER",
      tableName: "User",
      recordId: user.id,
      newData: user,
      ipAddress: req.ip
    });

    return res.status(201).json(user);
  })
);

usersRouter.patch(
  "/:id/toggle",
  validate(userIdParamsSchema),
  asyncHandler(async (req, res) => {
    const targetUserId = String(req.params.id);

    if (targetUserId === req.user?.id) {
      throw new AppError(400, "No puedes desactivar tu propio usuario");
    }

    const oldData = await prisma.user.findUnique({
      where: {
        id: targetUserId
      }
    });

    if (!oldData) {
      throw new AppError(404, "Usuario no encontrado");
    }

    const user = await prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        isActive: !oldData.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user.isActive) {
      await prisma.refreshSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
    }

    await auditLog({
      userId: req.user?.id,
      action: "TOGGLE_ACTIVE",
      tableName: "User",
      recordId: user.id,
      oldData,
      newData: user,
      ipAddress: req.ip
    });

    return res.status(200).json(user);
  })
);

usersRouter.patch(
  "/:id/role",
  validate(updateUserRoleSchema),
  asyncHandler(async (req, res) => {
    const targetUserId = String(req.params.id);
    const nextRole = req.body.role as Role;

    const oldData = await prisma.user.findUnique({
      where: {
        id: targetUserId
      }
    });

    if (!oldData) {
      throw new AppError(404, "Usuario no encontrado");
    }

    if (targetUserId === req.user?.id && nextRole !== Role.ADMIN) {
      throw new AppError(400, "No puedes quitarte tu propio rol de administrador");
    }

    const user = await prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        role: nextRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    await auditLog({
      userId: req.user?.id,
      action: "UPDATE_USER_ROLE",
      tableName: "User",
      recordId: user.id,
      oldData,
      newData: user,
      ipAddress: req.ip
    });

    return res.status(200).json(user);
  })
);

usersRouter.patch(
  "/:id/password",
  validate(resetUserPasswordSchema),
  asyncHandler(async (req, res) => {
    const targetUserId = String(req.params.id);

    const oldData = await prisma.user.findUnique({
      where: {
        id: targetUserId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!oldData) {
      throw new AppError(404, "Usuario no encontrado");
    }

    const passwordHash = await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    await prisma.refreshSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    await auditLog({
      userId: req.user?.id,
      action: "RESET_USER_PASSWORD",
      tableName: "User",
      recordId: user.id,
      oldData,
      newData: user,
      ipAddress: req.ip
    });

    return res.status(200).json(user);
  })
);
