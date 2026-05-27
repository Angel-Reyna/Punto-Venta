import { useNavigate } from "react-router-dom";

import { MetricCard } from "../../components/data-display";

import { panelTitleActionLabel } from "./dashboard.navigation";
import { type MetricCardProps } from "./dashboard.types";

export function DashboardMetricCard({
  title,
  value,
  description,
  icon,
  to,
  tone = "default",
  footer,
}: MetricCardProps) {
  const navigate = useNavigate();

  return (
    <MetricCard
      actionLabel={to ? panelTitleActionLabel(to) : undefined}
      description={description}
      footer={footer}
      icon={icon}
      onActionClick={to ? () => navigate(to) : undefined}
      title={title}
      tone={tone}
      value={value}
    />
  );
}
