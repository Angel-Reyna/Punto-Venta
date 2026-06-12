import { type ReactNode } from "react";

import { Box } from "@mui/material";

import { useNavigate } from "react-router-dom";

import { SectionCard } from "../../components/layout";
import { panelTitleActionLabel } from "./dashboard.navigation";

export function DashboardPanelCard({
  title,
  subtitle,
  action,
  actionTo,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  actionTo?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <Box sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      <SectionCard
        title={title}
        subtitle={subtitle}
        action={action}
        actionLabel={actionTo ? panelTitleActionLabel(actionTo) : undefined}
        onActionClick={actionTo ? () => navigate(actionTo) : undefined}
      >
        {children}
      </SectionCard>
    </Box>
  );
}
