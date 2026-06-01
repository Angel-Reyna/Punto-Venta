import type { ReactNode } from "react";

import { Box } from "@mui/material";

export type VisualMetricGridProps = {
  children: ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  marginBottom?: number;
  testId?: string;
};

function toGridTemplateColumns(
  columns: NonNullable<VisualMetricGridProps["columns"]>,
  breakpoint: keyof NonNullable<VisualMetricGridProps["columns"]>,
) {
  const count = columns[breakpoint];

  return count ? `repeat(${count}, minmax(0, 1fr))` : undefined;
}

export function VisualMetricGrid({
  children,
  columns = { xs: 1, sm: 2, lg: 4 },
  marginBottom = 0,
  testId,
}: VisualMetricGridProps) {
  return (
    <Box
      data-testid={testId}
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: toGridTemplateColumns(columns, "xs"),
          sm: toGridTemplateColumns(columns, "sm"),
          md: toGridTemplateColumns(columns, "md"),
          lg: toGridTemplateColumns(columns, "lg"),
          xl: toGridTemplateColumns(columns, "xl"),
        },
        mb: marginBottom,
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  );
}
