import { Box } from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { VisualMetricCard } from "../../components/VisualMetricCard";

import type { UserSummary } from "./userShared";

export function UsersSummaryCards({ userSummary }: { userSummary: UserSummary }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        },
        mb: 0,
      }}
    >
      <VisualMetricCard
        icon={<CheckCircleOutlineIcon />}
        label="Usuarios activos"
        value={userSummary.activeUsers}
        helper="Pueden iniciar sesión."
        tone="success"
      />
      <VisualMetricCard
        icon={<BadgeOutlinedIcon />}
        label="Vendedores"
        value={userSummary.sellerUsers}
        helper="Registran ventas."
        tone="info"
      />
      <VisualMetricCard
        icon={<AdminPanelSettingsIcon />}
        label="Administradores"
        value={userSummary.adminUsers}
        helper="Gestionan la operación."
        tone="primary"
      />
      <VisualMetricCard
        icon={<BlockOutlinedIcon />}
        label="Inactivos"
        value={userSummary.inactiveUsers}
        helper="Acceso bloqueado."
        tone="neutral"
      />
    </Box>
  );
}
