import { Router } from "express";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";
import { env } from "../../config/env";

import {
  requireAuth,
  requireRole
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { auditLog } from "../audit/audit.service";

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),

    password: z
      .string()
      .min(8)
      .max(72)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/),

    role: z.enum(["ADMIN", "CASHIER"])
  })
});

export const usersRouter = Router();

usersRouter.use(
  requireAuth,
  requireRole(Role.ADMIN)
);

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

    res.json(users);
  })
);

usersRouter.post(
  "/",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(
      req.body.password,
      env.BCRYPT_ROUNDS
    );

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

    res.status(201).json(user);
  })
);

usersRouter.patch(
  "/:id/toggle",
  asyncHandler(async (req, res) => {
    const oldData =
      await prisma.user.findUniqueOrThrow({
        where: {
          id: String(req.params.id)
        }
      });

    const user = await prisma.user.update({
      where: {
        id: String(req.params.id)
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

    await auditLog({
      userId: req.user?.id,
      action: "TOGGLE_ACTIVE",
      tableName: "User",
      recordId: user.id,
      oldData,
      newData: user,
      ipAddress: req.ip
    });

    res.json(user);
  })
);