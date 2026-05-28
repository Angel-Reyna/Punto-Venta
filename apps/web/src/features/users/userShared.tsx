import { normalizeSearchText } from "../../utils/text";

export type UserRole = "ADMIN" | "CASHIER";
export type RoleFilter = "ALL" | UserRole;
export type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type UserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type ResetPasswordForm = {
  password: string;
  confirmPassword: string;
};

export type UserSummary = {
  activeUsers: number;
  inactiveUsers: number;
  sellerUsers: number;
  adminUsers: number;
};

export const initialForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "CASHIER",
};

export const initialResetPasswordForm: ResetPasswordForm = {
  password: "",
  confirmPassword: "",
};

export function isPasswordValid(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function getRoleLabel(role: UserRole) {
  return role === "ADMIN" ? "Administrador" : "Vendedor";
}

export function getRoleDescription(role: UserRole) {
  return role === "ADMIN"
    ? "Gestiona catálogo, inventario, vendedores y reportes."
    : "Registra ventas y consulta información operativa permitida.";
}

export function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "US";
}

function getUserSearchText(user: User) {
  return normalizeSearchText(
    [
      user.name,
      user.email,
      getRoleLabel(user.role),
      user.role,
      user.isActive ? "activo" : "inactivo",
    ].join(" "),
  );
}

export function summarizeUsers(rows: User[]): UserSummary {
  return rows.reduce<UserSummary>(
    (summary, item) => {
      if (item.isActive) summary.activeUsers += 1;
      else summary.inactiveUsers += 1;

      if (item.role === "CASHIER") summary.sellerUsers += 1;
      if (item.role === "ADMIN") summary.adminUsers += 1;

      return summary;
    },
    {
      activeUsers: 0,
      inactiveUsers: 0,
      sellerUsers: 0,
      adminUsers: 0,
    },
  );
}

export function filterUsers(
  rows: User[],
  query: string,
  roleFilter: RoleFilter,
  statusFilter: StatusFilter,
) {
  const normalizedQuery = normalizeSearchText(query);

  return rows.filter((item) => {
    const matchesQuery = normalizedQuery
      ? getUserSearchText(item).includes(normalizedQuery)
      : true;
    const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? item.isActive : !item.isActive);

    return matchesQuery && matchesRole && matchesStatus;
  });
}

export function getStatusFilterLabel(statusFilter: StatusFilter) {
  if (statusFilter === "ALL") return "Todos los estados";

  return statusFilter === "ACTIVE" ? "Activos" : "Inactivos";
}

export function getRoleFilterLabel(roleFilter: RoleFilter) {
  return roleFilter === "ALL" ? "Todos los roles" : getRoleLabel(roleFilter);
}
