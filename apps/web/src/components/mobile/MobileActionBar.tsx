import type { ReactNode } from "react";

import { Paper, Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export function MobileActionBar({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Paper
      elevation={8}
      sx={[
        {
          position: "sticky",
          bottom: 0,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          display: { xs: "block", md: "none" },
          mx: -2,
          mt: 2,
          p: 1.5,
          borderRadius: "20px 20px 0 0",
          border: "1px solid",
          borderColor: "divider",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Stack spacing={1}>{children}</Stack>
    </Paper>
  );
}
