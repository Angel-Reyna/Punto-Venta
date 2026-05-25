import bcrypt from "bcrypt";
import { Prisma, Role } from "@prisma/client";

import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { auditLog } from "../audit/audit.service";
import { logoutAll } from "../auth/auth.service";
import {
  CreateUserInput,
  PublicUser,
  ResetUserPasswordInput,
  UpdateUserRoleInput,
  UserListFilters,
  publicUserSelect
} from "./users.shared";

export async function listUsers(filters: UserListFilters): Promise<{
  total: number;
  users: PublicUser[];
}> {
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.active === undefined ? {} : { isActive: filters.active }),
    ...(filters.q
      ? {
          OR: [
            {
              name: {
                contains: filters.q,
                mode: "insensitive"
              }
            },
            {
              email: {
                contains: filters.q,
                mode: "insensitive"
              }
            }
          ]
        }
      : {})
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: {
        createdAt: "desc"
      },
      skip: filters.skip,
      take: filters.take
    })
  ]);

  return {
    total,
    users
  };
}

export async function createUser(args: {
  input: CreateUserInput;
  actorUserId?: string;
  ipAddress?: string;
}): Promise<PublicUser> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: args.input.email
    },
    select: {
      id: true
    }
  });

  if (existingUser) {
    throw new AppError(409, "El correo ya está registrado");
  }

  const passwordHash = await bcrypt.hash(args.input.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: args.input.name,
      email: args.input.email,
      passwordHash,
      role: args.input.role
    },
    select: publicUserSelect
  });

  await auditLog({
    userId: args.actorUserId,
    action: "CREATE_USER",
    tableName: "User",
    recordId: user.id,
    newData: user,
    ipAddress: args.ipAddress
  });

  return user;
}

export async function toggleUserActive(args: {
  targetUserId: string;
  actorUserId?: string;
  ipAddress?: string;
}): Promise<PublicUser> {
  if (args.targetUserId === args.actorUserId) {
    throw new AppError(400, "No puedes desactivar tu propio usuario");
  }

  const oldData = await prisma.user.findUnique({
    where: {
      id: args.targetUserId
    },
    select: publicUserSelect
  });

  if (!oldData) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const user = await prisma.user.update({
    where: {
      id: args.targetUserId
    },
    data: {
      isActive: !oldData.isActive
    },
    select: publicUserSelect
  });

  if (!user.isActive) {
    await logoutAll(user.id);
  }

  await auditLog({
    userId: args.actorUserId,
    action: "TOGGLE_ACTIVE",
    tableName: "User",
    recordId: user.id,
    oldData,
    newData: user,
    ipAddress: args.ipAddress
  });

  return user;
}

export async function updateUserRole(args: {
  targetUserId: string;
  input: UpdateUserRoleInput;
  actorUserId?: string;
  ipAddress?: string;
}): Promise<PublicUser> {
  const oldData = await prisma.user.findUnique({
    where: {
      id: args.targetUserId
    },
    select: publicUserSelect
  });

  if (!oldData) {
    throw new AppError(404, "Usuario no encontrado");
  }

  if (args.targetUserId === args.actorUserId && args.input.role !== Role.ADMIN) {
    throw new AppError(400, "No puedes quitarte tu propio rol de administrador");
  }

  const user = await prisma.user.update({
    where: {
      id: args.targetUserId
    },
    data: {
      role: args.input.role
    },
    select: publicUserSelect
  });

  if (oldData.role !== user.role) {
    await logoutAll(user.id);
  }

  await auditLog({
    userId: args.actorUserId,
    action: "UPDATE_USER_ROLE",
    tableName: "User",
    recordId: user.id,
    oldData,
    newData: user,
    ipAddress: args.ipAddress
  });

  return user;
}

export async function resetUserPassword(args: {
  targetUserId: string;
  input: ResetUserPasswordInput;
  actorUserId?: string;
  ipAddress?: string;
}): Promise<PublicUser> {
  const oldData = await prisma.user.findUnique({
    where: {
      id: args.targetUserId
    },
    select: publicUserSelect
  });

  if (!oldData) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const passwordHash = await bcrypt.hash(args.input.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.update({
    where: {
      id: args.targetUserId
    },
    data: {
      passwordHash
    },
    select: publicUserSelect
  });

  await logoutAll(user.id);

  await auditLog({
    userId: args.actorUserId,
    action: "RESET_USER_PASSWORD",
    tableName: "User",
    recordId: user.id,
    oldData,
    newData: user,
    ipAddress: args.ipAddress
  });

  return user;
}
