import type { ReactNode } from "react";

import { Box, Typography } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

export function EmptyStatePanel({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={[
        (theme) => ({
          py: 4,
          px: 2,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.text.secondary, theme.palette.mode === "dark" ? 0.08 : 0.045),
          border: "1px dashed",
          borderColor: "divider",
          textAlign: "center",
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Typography color="text.secondary" variant="body2">
        {children}
      </Typography>
    </Box>
  );
}
