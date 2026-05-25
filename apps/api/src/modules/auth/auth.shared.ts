import { Role } from "@prisma/client";

import { env } from "../../config/env";
import { getPermissionsForRole, type Permission } from "./permissions";

export type ClientMeta = {
  userAgent?: string;
  ipAddress?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type PublicAuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
};

export type AuthResult = {
  user: PublicAuthUser;
  accessToken: string;
  refreshToken: string;
};

export type UserForPublicAuth = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getRefreshExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

export function toPublicUser(user: UserForPublicAuth): PublicAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: [...getPermissionsForRole(user.role)]
  };
}
