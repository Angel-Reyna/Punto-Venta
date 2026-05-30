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
      sx={(theme) => {
        const toneColor = theme.palette[tone].main;
        const isDark = theme.palette.mode === "dark";

        return {
          height: "100%",
          borderColor: alpha(toneColor, isDark ? 0.22 : 0.24),
          background: `linear-gradient(135deg, ${alpha(
            toneColor,
            isDark ? 0.12 : 0.08,
          )}, ${alpha(theme.palette.background.paper, isDark ? 0.92 : 0.96)})`,
          boxShadow: isDark
            ? "0 16px 38px rgba(0, 0, 0, 0.18)"
            : "0 12px 30px rgba(15, 23, 42, 0.05)",
        };
      }}
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
              bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.14 : 0.11),
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
