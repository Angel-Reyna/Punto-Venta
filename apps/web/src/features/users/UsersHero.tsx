import type { ReactElement } from "react";

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import { PageHeader } from "../../components/PageHeader";
import type { UserSummary } from "./userShared";

type UsersHeroProps = {
  totalUsers: number;
  userSummary: UserSummary;
};

export function UsersHero({ totalUsers, userSummary }: UsersHeroProps) {
  const inactiveAccessRatio = totalUsers
    ? Math.round((userSummary.inactiveUsers / totalUsers) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Usuarios y vendedores"
        subtitle="Gestiona altas, roles y bloqueos sin perder el estado de cada acceso."
      />

      <Card
        data-testid="users-access-hero"
        variant="outlined"
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.09 : 0.045),
          borderColor: alpha(theme.palette.primary.main, 0.16),
          mb: 1.5,
          overflow: "hidden",
        })}
      >
        <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, "&:last-child": { pb: { xs: 1.5, md: 1.75 } } }}>
          <Box
            sx={{
              alignItems: { xs: "stretch", lg: "center" },
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                lg: "minmax(0, 1fr) auto",
              },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={(theme) => ({
                  alignItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  borderRadius: 2.25,
                  color: "primary.main",
                  display: "inline-flex",
                  flex: "0 0 auto",
                  height: 42,
                  justifyContent: "center",
                  width: 42,
                })}
              >
                <ShieldOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" color="primary" fontWeight={950} sx={{ letterSpacing: 0.7 }}>
                  Control de accesos interno
                </Typography>
                <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.35, lineHeight: 1.08 }}>
                  Personas, permisos y estado de acceso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Alta rápida y directorio operativo en una vista compacta.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              justifyContent={{ xs: "flex-start", lg: "flex-end" }}
              data-testid="users-hero-chips"
            >
              <HeroChip icon={<CheckCircleOutlineIcon />} label="Activos" value={userSummary.activeUsers} tone="success" />
              <HeroChip icon={<BadgeOutlinedIcon />} label="Vendedores" value={userSummary.sellerUsers} tone="success" />
              <HeroChip icon={<AdminPanelSettingsOutlinedIcon />} label="Admins" value={userSummary.adminUsers} tone="primary" />
              <HeroChip icon={<BlockOutlinedIcon />} label="Bloqueados" value={`${inactiveAccessRatio}%`} tone="warning" />
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

function HeroChip({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactElement;
  label: string;
  tone: "primary" | "success" | "warning";
  value: number | string;
}) {
  return (
    <Chip
      icon={icon}
      label={`${label}: ${value}`}
      color={tone}
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        fontWeight: 900,
        height: 34,
        "& .MuiChip-icon": { fontSize: 18 },
      }}
    />
  );
}
