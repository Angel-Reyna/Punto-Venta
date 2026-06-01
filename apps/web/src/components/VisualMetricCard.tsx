import type { ReactNode } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";

export type VisualMetricTone = "primary" | "success" | "warning" | "info" | "error" | "neutral";

export type VisualMetricCardProps = {
  helper: string;
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: VisualMetricTone;
};

function getVisualMetricToneColor(theme: Theme, tone: VisualMetricTone) {
  if (tone === "neutral") {
    return theme.palette.text.secondary;
  }

  return theme.palette[tone].main;
}

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
        const toneColor = getVisualMetricToneColor(theme, tone);
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
            sx={(theme) => {
              const toneColor = getVisualMetricToneColor(theme, tone);

              return {
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: 2,
                color: toneColor,
                bgcolor: alpha(toneColor, theme.palette.mode === "dark" ? 0.14 : 0.11),
                flexShrink: 0,
              };
            }}
          >
            {icon}
          </Box>

          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={900} lineHeight={1.1} sx={{ overflowWrap: "anywhere" }}>
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
