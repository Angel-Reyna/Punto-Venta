import { type ReactNode } from "react";

import { useNavigate } from "react-router-dom";

import { SectionCard } from "../../components/layout";

export function DashboardPanelCard({
  title,
  subtitle,
  actionTo,
  children,
}: {
  title: string;
  subtitle?: string;
  actionTo?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      onActionClick={actionTo ? () => navigate(actionTo) : undefined}
    >
      {children}
    </SectionCard>
  );
}
