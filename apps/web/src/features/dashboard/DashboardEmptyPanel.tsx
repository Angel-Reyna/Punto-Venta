import { type ReactNode } from "react";

import { EmptyStatePanel } from "../../components/data-display";

export function DashboardEmptyPanel({ children }: { children: ReactNode }) {
  return <EmptyStatePanel>{children}</EmptyStatePanel>;
}
