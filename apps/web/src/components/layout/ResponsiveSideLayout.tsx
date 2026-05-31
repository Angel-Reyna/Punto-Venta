import type { ReactNode } from "react";

import { Box } from "@mui/material";

export type ResponsiveSideLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  desktopSidebarPosition?: "left" | "right";
  mobileSidebarPosition?: "before" | "after";
  sidebarWidth?: string;
  stickyTop?: number;
  hideSidebarOnMobile?: boolean;
  gap?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
};

export function ResponsiveSideLayout({
  children,
  desktopSidebarPosition = "right",
  gap = 2,
  hideSidebarOnMobile = false,
  mobileSidebarPosition = "after",
  sidebar,
  sidebarWidth = "360px",
  stickyTop = 88,
}: ResponsiveSideLayoutProps) {
  const hasSidebar = Boolean(sidebar);

  const mobileTemplateAreas =
    hasSidebar && !hideSidebarOnMobile
      ? mobileSidebarPosition === "before"
        ? '"sidebar" "main"'
        : '"main" "sidebar"'
      : '"main"';

  const desktopTemplateAreas = hasSidebar
    ? desktopSidebarPosition === "left"
      ? '"sidebar main"'
      : '"main sidebar"'
    : '"main"';

  const desktopTemplateColumns = hasSidebar
    ? desktopSidebarPosition === "left"
      ? `${sidebarWidth} minmax(0, 1fr)`
      : `minmax(0, 1fr) ${sidebarWidth}`
    : "minmax(0, 1fr)";

  return (
    <Box
      sx={{
        alignItems: "start",
        display: "grid",
        gap,
        gridTemplateAreas: {
          xs: mobileTemplateAreas,
          lg: desktopTemplateAreas,
        },
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          lg: desktopTemplateColumns,
        },
      }}
    >
      <Box sx={{ gridArea: "main", minWidth: 0 }}>{children}</Box>

      {hasSidebar && (
        <Box
          sx={{
            display: { xs: hideSidebarOnMobile ? "none" : "block", lg: "block" },
            gridArea: "sidebar",
            minWidth: 0,
            position: { lg: "sticky" },
            top: { lg: stickyTop },
          }}
        >
          {sidebar}
        </Box>
      )}
    </Box>
  );
}
