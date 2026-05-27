import { type ReactNode } from "react";

import { Box, Typography } from "@mui/material";

export function DashboardEmptyPanel({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        py: 4,
        px: 2,
        borderRadius: 3,
        bgcolor: "grey.50",
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center"
      }}
    >
      <Typography color="text.secondary" variant="body2">
        {children}
      </Typography>
    </Box>
  );
}
