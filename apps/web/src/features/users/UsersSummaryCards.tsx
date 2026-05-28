import type { ReactNode } from "react";

import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import type { UserSummary } from "./userShared";

type SummaryTone = "success" | "seller" | "admin" | "inactive";

type SummaryCardProps = {
  helper: string;
  icon: ReactNode;
  label: string;
  tone: SummaryTone;
  value: number;
};

function getSummaryToneColors(theme: Theme, tone: SummaryTone) {
  if (tone === "admin") {
    return {
      border: alpha(theme.palette.primary.main, 0.28),
      iconBg: alpha(theme.palette.primary.main, 0.12),
      iconColor: theme.palette.primary.main,
      surface: alpha(theme.palette.primary.light, 0.08),
    };
  }

  if (tone === "seller") {
    return {
      border: alpha(theme.palette.info.main, 0.28),
      iconBg: alpha(theme.palette.info.main, 0.12),
      iconColor: theme.palette.info.main,
      surface: alpha(theme.palette.info.light, 0.08),
    };
  }

  if (tone === "inactive") {
    return {
      border: theme.palette.divider,
      iconBg: theme.palette.action.hover,
      iconColor: theme.palette.text.secondary,
      surface: alpha(theme.palette.action.disabledBackground, 0.35),
    };
  }

  return {
    border: alpha(theme.palette.success.main, 0.28),
    iconBg: alpha(theme.palette.success.main, 0.12),
    iconColor: theme.palette.success.main,
    surface: alpha(theme.palette.success.light, 0.08),
  };
}

function SummaryCard({ helper, icon, label, tone, value }: SummaryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => {
        const colors = getSummaryToneColors(theme, tone);

        return {
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.98,
          )} 0%, ${colors.surface} 100%)`,
          borderColor: colors.border,
          height: "100%",
        };
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            variant="rounded"
            sx={(theme) => {
              const colors = getSummaryToneColors(theme, tone);

              return {
                bgcolor: colors.iconBg,
                color: colors.iconColor,
                height: 44,
                width: 44,
              };
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={900} lineHeight={1.1}>
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

export function UsersSummaryCards({ userSummary }: { userSummary: UserSummary }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        mb: 2,
      }}
    >
      <SummaryCard
        icon={<CheckCircleOutlineIcon />}
        label="Usuarios activos"
        value={userSummary.activeUsers}
        helper="Pueden iniciar sesión."
        tone="success"
      />
      <SummaryCard
        icon={<BadgeOutlinedIcon />}
        label="Vendedores"
        value={userSummary.sellerUsers}
        helper="Registran ventas."
        tone="seller"
      />
      <SummaryCard
        icon={<AdminPanelSettingsIcon />}
        label="Administradores"
        value={userSummary.adminUsers}
        helper="Gestionan la operación."
        tone="admin"
      />
      <SummaryCard
        icon={<BlockOutlinedIcon />}
        label="Inactivos"
        value={userSummary.inactiveUsers}
        helper="Acceso bloqueado."
        tone="inactive"
      />
    </Box>
  );
}
