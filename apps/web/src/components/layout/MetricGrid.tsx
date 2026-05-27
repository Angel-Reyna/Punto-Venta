import type { ReactNode } from "react";

import { Grid } from "@mui/material";

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <Grid container spacing={2.5}>
      {children}
    </Grid>
  );
}
