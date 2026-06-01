import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { VisualMetricCard } from "../../components/VisualMetricCard";
import { VisualMetricGrid } from "../../components/VisualMetricGrid";

import type { UserSummary } from "./userShared";

export function UsersSummaryCards({ userSummary }: { userSummary: UserSummary }) {
  return (
    <VisualMetricGrid columns={{ xs: 1, sm: 2, xl: 4 }}>
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
    </VisualMetricGrid>
  );
}
