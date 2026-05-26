import type { ReactNode } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type VisualMetricTone = "primary" | "success" | "warning" | "info" | "error";

export type VisualMetricCardProps = {
  helper: string;
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: VisualMetricTone;
};

export function VisualMetricCard({
  helper,
  icon,
  label,
  value,
  tone = "primary",
}: VisualMetricCardProps) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        borderColor: alpha(theme.palette[tone].main, 0.28),
        background: `linear-gradient(135deg, ${alpha(
          theme.palette[tone].main,
          0.1,
        )}, ${alpha(theme.palette.background.paper, 0.94)})`,
      })}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              width: 42,
              height: 42,
              borderRadius: 2,
              color: theme.palette[tone].main,
              bgcolor: alpha(theme.palette[tone].main, 0.12),
              flexShrink: 0,
            })}
          >
            {icon}
          </Box>

          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={900} lineHeight={1.1}>
              {value}
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
