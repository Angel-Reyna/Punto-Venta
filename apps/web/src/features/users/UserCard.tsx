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
import { alpha } from "@mui/material/styles";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";

import {
  formatCreatedAt,
  getInitials,
  getRoleDescription,
  getRoleLabel,
} from "./userShared";
import type { User } from "./userShared";

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
  const toggleLabel = targetUser.isActive ? "Desactivar acceso" : "Activar acceso";
  const toggleHelper = targetUser.isActive
    ? "Bloquea el inicio de sesión y revoca sesiones activas."
    : "Permite que esta persona vuelva a iniciar sesión.";

  return (
    <Card
      variant="outlined"
      data-testid={`user-card-${targetUser.id}`}
      sx={(theme) => ({
        borderColor: targetUser.isActive
          ? alpha(
              targetUser.role === "ADMIN"
                ? theme.palette.primary.main
                : theme.palette.info.main,
              0.2,
            )
          : "action.disabledBackground",
        boxShadow: targetUser.isActive ? theme.shadows[1] : "none",
        height: "100%",
        opacity: targetUser.isActive ? 1 : 0.82,
        overflow: "hidden",
        position: "relative",
        "&::before": {
          bgcolor: targetUser.isActive
            ? targetUser.role === "ADMIN"
              ? "primary.main"
              : "info.main"
            : "action.disabled",
          content: '""',
          height: "100%",
          left: 0,
          position: "absolute",
          top: 0,
          width: 5,
        },
      })}
    >
      <CardContent sx={{ pl: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar
              sx={{
                bgcolor:
                  targetUser.role === "ADMIN" ? "primary.main" : "success.main",
                color: "primary.contrastText",
                flex: "0 0 auto",
                height: 48,
                width: 48,
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

          <Box
            sx={(theme) => ({
              bgcolor: alpha(theme.palette.action.hover, 0.55),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 1.5,
            })}
          >
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

          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Acciones del acceso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {toggleHelper}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: "minmax(0, 1fr)",
              }}
            >
              <Button
                size="small"
                variant="outlined"
                data-testid={`user-toggle-${targetUser.id}`}
                disabled={isSelf || isBusy}
                onClick={() => onToggleUser(targetUser)}
                sx={{ justifyContent: "center" }}
              >
                {togglingUserId === targetUser.id ? "Guardando..." : toggleLabel}
              </Button>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "1fr",
                    xl: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  data-testid={`user-role-${targetUser.id}`}
                  startIcon={<ManageAccountsOutlinedIcon />}
                  disabled={isBusy}
                  onClick={() => onOpenRoleDialog(targetUser)}
                  sx={{ justifyContent: "center" }}
                >
                  Cambiar rol
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  data-testid={`user-reset-password-${targetUser.id}`}
                  startIcon={<KeyOutlinedIcon />}
                  disabled={isBusy}
                  onClick={() => onOpenResetPasswordDialog(targetUser)}
                  sx={{ justifyContent: "center" }}
                >
                  Nueva contraseña
                </Button>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
