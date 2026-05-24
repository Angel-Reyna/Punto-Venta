import type { ReactNode } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";

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

function getRoleDescription(role: UserRole) {
  return role === "ADMIN"
    ? "Gestiona catálogo, inventario, vendedores y reportes."
    : "Registra ventas y consulta información operativa permitida.";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "US";
}

function getUserSearchText(user: User) {
  return normalizeSearch(
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
  const normalizedQuery = normalizeSearch(query);

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

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: number;
  helper: string;
};

export function SummaryCard({ icon, label, value, helper }: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "action.hover",
              color: "text.primary",
              height: 40,
              width: 40,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

type UserCardProps = {
  currentUserId?: string;
  isBusy: boolean;
  onOpenResetPasswordDialog: (targetUser: User) => void;
  onOpenRoleDialog: (targetUser: User) => void;
  onToggleUser: (targetUser: User) => void;
  targetUser: User;
  togglingUserId: string | null;
};

export function UserCard({
  currentUserId,
  isBusy,
  onOpenResetPasswordDialog,
  onOpenRoleDialog,
  onToggleUser,
  targetUser,
  togglingUserId,
}: UserCardProps) {
  const isSelf = targetUser.id === currentUserId;
  const roleLabel = getRoleLabel(targetUser.role);
  const statusLabel = targetUser.isActive ? "Activo" : "Inactivo";
  const toggleLabel = targetUser.isActive ? "Desactivar" : "Activar";

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: targetUser.isActive
          ? "divider"
          : "action.disabledBackground",
        height: "100%",
        opacity: targetUser.isActive ? 1 : 0.82,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar
              sx={{
                bgcolor:
                  targetUser.role === "ADMIN" ? "primary.main" : "success.main",
                color: "primary.contrastText",
                flex: "0 0 auto",
              }}
            >
              {getInitials(targetUser.name, targetUser.email)}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Typography variant="subtitle1" fontWeight={800} noWrap>
                  {targetUser.name}
                </Typography>
                {isSelf && <Chip size="small" label="Tú" variant="outlined" />}
              </Stack>

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ color: "text.secondary", minWidth: 0 }}
              >
                <MailOutlineIcon sx={{ fontSize: 16, flex: "0 0 auto" }} />
                <Typography variant="body2" noWrap title={targetUser.email}>
                  {targetUser.email}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              icon={
                targetUser.role === "ADMIN" ? (
                  <AdminPanelSettingsIcon />
                ) : (
                  <BadgeOutlinedIcon />
                )
              }
              label={roleLabel}
              color={targetUser.role === "ADMIN" ? "primary" : "success"}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={
                targetUser.isActive ? (
                  <CheckCircleOutlineIcon />
                ) : (
                  <BlockOutlinedIcon />
                )
              }
              label={statusLabel}
              color={targetUser.isActive ? "success" : "default"}
              variant={targetUser.isActive ? "outlined" : "filled"}
            />
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {getRoleDescription(targetUser.role)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Creado: {formatCreatedAt(targetUser.createdAt)}
            </Typography>
          </Box>

          {isSelf && (
            <Alert severity="info" variant="outlined">
              Este es tu usuario actual. No puedes desactivar tu propio acceso.
            </Alert>
          )}

          <Divider />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{
              "& .MuiButton-root": {
                justifyContent: "center",
              },
            }}
          >
            <Button
              size="small"
              variant="outlined"
              disabled={isSelf || isBusy}
              onClick={() => onToggleUser(targetUser)}
            >
              {togglingUserId === targetUser.id ? "Guardando..." : toggleLabel}
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<ManageAccountsOutlinedIcon />}
              disabled={isBusy}
              onClick={() => onOpenRoleDialog(targetUser)}
            >
              Cambiar rol
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<KeyOutlinedIcon />}
              disabled={isBusy}
              onClick={() => onOpenResetPasswordDialog(targetUser)}
            >
              Nueva contraseña
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
