import { Router } from "express";
import { Role } from "@prisma/client";

import { requireAuth, requirePermission } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import {
  buildPaginationMeta,
  getOptionalBoolean,
  getOptionalString,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";
import { PERMISSIONS } from "../auth/permissions";
import {
  createUser,
  listUsers,
  resetUserPassword,
  toggleUserActive,
  updateUserRole
} from "./users.service";
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserRoleSchema,
  userIdParamsSchema
} from "./users.shared";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/",
  requirePermission(PERMISSIONS.UsersRead),
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as Record<string, unknown>, {
      defaultPageSize: 50,
      maxPageSize: 100
    });
    const q = getOptionalString(req.query.q, 120);
    const role = getOptionalString(req.query.role, 30);
    const active = getOptionalBoolean(req.query.active);

    if (role && !Object.values(Role).includes(role as Role)) {
      throw new AppError(400, "role inválido");
    }

    const result = await listUsers({
      q,
      role: role as Role | undefined,
      active,
      skip: pagination.skip,
      take: pagination.take
    });

    setPaginationHeaders(res, buildPaginationMeta(pagination, result.total));

    return res.status(200).json(result.users);
  })
);

usersRouter.post(
  "/",
  requirePermission(PERMISSIONS.UsersCreate),
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await createUser({
      input: req.body,
      actorUserId: req.user?.id,
      ipAddress: req.ip
    });

    return res.status(201).json(user);
  })
);

usersRouter.patch(
  "/:id/toggle",
  requirePermission(PERMISSIONS.UsersToggleActive),
  validate(userIdParamsSchema),
  asyncHandler(async (req, res) => {
    const user = await toggleUserActive({
      targetUserId: String(req.params.id),
      actorUserId: req.user?.id,
      ipAddress: req.ip
    });

    return res.status(200).json(user);
  })
);

usersRouter.patch(
  "/:id/role",
  requirePermission(PERMISSIONS.UsersUpdateRole),
  validate(updateUserRoleSchema),
  asyncHandler(async (req, res) => {
    const user = await updateUserRole({
      targetUserId: String(req.params.id),
      input: req.body,
      actorUserId: req.user?.id,
      ipAddress: req.ip
    });

    return res.status(200).json(user);
  })
);

usersRouter.patch(
  "/:id/password",
  requirePermission(PERMISSIONS.UsersResetPassword),
  validate(resetUserPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await resetUserPassword({
      targetUserId: String(req.params.id),
      input: req.body,
      actorUserId: req.user?.id,
      ipAddress: req.ip
    });

    return res.status(200).json(user);
  })
);
