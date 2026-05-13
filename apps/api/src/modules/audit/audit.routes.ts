import { Router } from "express";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requireRole
} from "../../middlewares/auth";

import { asyncHandler } from "../../utils/asyncHandler";

export const auditRouter = Router();

auditRouter.use(
  requireAuth,
  requireRole(Role.ADMIN)
);

auditRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      },

      take: 500
    });

    res.json(logs);
  })
);