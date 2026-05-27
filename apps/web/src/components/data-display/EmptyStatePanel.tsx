import type { ReactNode } from "react";

import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export function EmptyStatePanel({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={[
        {
          py: 4,
          px: 2,
          borderRadius: 3,
          bgcolor: "grey.50",
          border: "1px dashed",
          borderColor: "divider",
          textAlign: "center",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Typography color="text.secondary" variant="body2">
        {children}
      </Typography>
    </Box>
  );
}
