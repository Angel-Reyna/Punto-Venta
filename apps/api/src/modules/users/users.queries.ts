import { Role } from "@prisma/client";

import { AppError } from "../../utils/AppError";
import { getOptionalBoolean, getOptionalString } from "../../utils/pagination";

export function parseUserListFilters(query: Record<string, unknown>) {
  const q = getOptionalString(query.q, 120);
  const role = getOptionalString(query.role, 30);
  const active = getOptionalBoolean(query.active);

  if (role && !Object.values(Role).includes(role as Role)) {
    throw new AppError(400, "role inválido");
  }

  return {
    q,
    role: role as Role | undefined,
    active
  };
}
