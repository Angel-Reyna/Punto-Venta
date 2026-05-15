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

const toggleUserSchema = z.object({
  params: z.object({
    id: z.string().uuid()
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
  validate(toggleUserSchema),
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
