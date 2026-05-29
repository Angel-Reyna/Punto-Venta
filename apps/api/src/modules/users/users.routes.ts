import { Router } from "express";
import { requireAuth, requirePermission } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  buildPaginationMeta,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";
import { PERMISSIONS } from "../auth/permissions";
import { parseUserListFilters } from "./users.queries";
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
    const filters = parseUserListFilters(req.query as Record<string, unknown>);

    const result = await listUsers({
      ...filters,
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
