import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

import { formatCreatedAt, getInitials, getRoleLabel } from "./userShared";
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
  const toggleLabel = targetUser.isActive ? "Desactivar" : "Activar";
  const roleTone = targetUser.role === "ADMIN" ? "primary" : "success";
  const statusTone = targetUser.isActive ? "success" : "warning";

  return (
    <Card
      variant="outlined"
      data-testid={`user-card-${targetUser.id}`}
      sx={(theme) => ({
        bgcolor: targetUser.isActive
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha(theme.palette.action.disabledBackground, 0.24),
        borderColor: alpha(theme.palette[roleTone].main, targetUser.isActive ? 0.22 : 0.12),
        height: "100%",
        opacity: targetUser.isActive ? 1 : 0.86,
        overflow: "hidden",
        position: "relative",
        "&::before": {
          bgcolor: targetUser.isActive ? `${roleTone}.main` : "action.disabled",
          content: '""',
          height: 4,
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        },
      })}
    >
      <CardContent sx={{ p: 1.25, pt: 1.5, "&:last-child": { pb: 1.25 } }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Avatar
              sx={{
                bgcolor: `${roleTone}.main`,
                color: "primary.contrastText",
                flex: "0 0 auto",
                fontSize: 14,
                fontWeight: 950,
                height: 38,
                width: 38,
              }}
            >
              {getInitials(targetUser.name, targetUser.email)}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={950} noWrap>
                  {targetUser.name}
                </Typography>
                {isSelf && <Chip size="small" label="Tú" variant="outlined" sx={{ height: 22 }} />}
              </Stack>

              <Stack direction="row" spacing={0.55} alignItems="center" sx={{ color: "text.secondary", minWidth: 0 }}>
                <MailOutlineIcon sx={{ fontSize: 15, flex: "0 0 auto" }} />
                <Typography variant="caption" noWrap title={targetUser.email}>
                  {targetUser.email}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.65} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              icon={targetUser.role === "ADMIN" ? <AdminPanelSettingsIcon /> : <BadgeOutlinedIcon />}
              label={roleLabel}
              color={roleTone}
              variant="outlined"
              sx={{ fontWeight: 900, height: 24 }}
            />
            <Chip
              size="small"
              icon={targetUser.isActive ? <CheckCircleOutlineIcon /> : <BlockOutlinedIcon />}
              label={statusLabel}
              color={statusTone}
              variant={targetUser.isActive ? "outlined" : "filled"}
              sx={{ fontWeight: 900, height: 24 }}
            />
            <Chip
              size="small"
              label={`Alta: ${formatCreatedAt(targetUser.createdAt)}`}
              variant="outlined"
              sx={{ height: 24 }}
            />
          </Stack>

          {isSelf && (
            <Alert severity="info" variant="outlined" sx={{ py: 0.25 }}>
              Tu usuario actual no se puede desactivar.
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gap: 0.65,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))", xl: "1fr" },
            }}
          >
            <Button
              size="small"
              variant={targetUser.isActive ? "outlined" : "contained"}
              color={targetUser.isActive ? "warning" : "success"}
              data-testid={`user-toggle-${targetUser.id}`}
              disabled={isSelf || isBusy}
              onClick={() => onToggleUser(targetUser)}
              sx={{ borderRadius: 2, fontWeight: 900, justifyContent: "center" }}
            >
              {togglingUserId === targetUser.id ? "Guardando..." : toggleLabel}
            </Button>

            <Button
              size="small"
              variant="outlined"
              data-testid={`user-role-${targetUser.id}`}
              startIcon={<ManageAccountsOutlinedIcon />}
              disabled={isBusy}
              onClick={() => onOpenRoleDialog(targetUser)}
              sx={{ borderRadius: 2, fontWeight: 900, justifyContent: "center" }}
            >
              Rol
            </Button>

            <Button
              size="small"
              variant="outlined"
              data-testid={`user-reset-password-${targetUser.id}`}
              startIcon={<KeyOutlinedIcon />}
              disabled={isBusy}
              onClick={() => onOpenResetPasswordDialog(targetUser)}
              sx={{ borderRadius: 2, fontWeight: 900, justifyContent: "center" }}
            >
              Nueva clave
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
