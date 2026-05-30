import type { ReactNode } from "react";

import { Box, Card, CardActionArea, CardContent, Tooltip, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";

export type MetricCardTone = "default" | "info" | "success" | "warning" | "critical";

function getToneColor(theme: Theme, tone: MetricCardTone) {
  if (tone === "default") {
    return theme.palette.mode === "dark" ? theme.palette.grey[500] : theme.palette.grey[300];
  }

  if (tone === "critical") {
    return theme.palette.error.main;
  }

  return theme.palette[tone].main;
}

export type MetricCardProps = {
  actionLabel?: string;
  description: ReactNode;
  footer?: ReactNode;
  icon: ReactNode;
  onActionClick?: () => void;
  title: string;
  tone?: MetricCardTone;
  value: ReactNode;
};

export function MetricCard({
  actionLabel,
  description,
  footer,
  icon,
  onActionClick,
  title,
  tone = "default",
  value,
}: MetricCardProps) {
  const content = (
    <CardContent
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" fontWeight={700} variant="body2">
            {title}
          </Typography>

          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              mt: 0.75,
              lineHeight: 1.05,
              fontSize: {
                xs: "1.75rem",
                md: "2rem",
              },
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={(theme) => {
            const toneColor = getToneColor(theme, tone);

            return {
              width: 42,
              height: 42,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              color: toneColor,
              backgroundColor: alpha(toneColor, theme.palette.mode === "dark" ? 0.14 : 0.1),
              flex: "0 0 auto",
            };
          }}
        >
          {icon}
        </Box>
      </Box>

      <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.45 }}>
        {description}
      </Typography>

      {footer && <Box sx={{ mt: "auto" }}>{footer}</Box>}
    </CardContent>
  );

  return (
    <Card
      sx={(theme) => {
        const toneColor = getToneColor(theme, tone);
        const isDark = theme.palette.mode === "dark";

        return {
          height: "100%",
          borderRadius: 4,
          border: "1px solid",
          borderColor: alpha(toneColor, tone === "default" ? 0.28 : 0.26),
          borderTop: "4px solid",
          borderTopColor: toneColor,
          background: `linear-gradient(180deg, ${alpha(
            toneColor,
            isDark ? 0.1 : 0.05,
          )} 0%, ${alpha(theme.palette.background.paper, isDark ? 0.94 : 0.98)} 100%)`,
          boxShadow: isDark
            ? "0 16px 40px rgba(0, 0, 0, 0.18)"
            : "0 12px 30px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
        };
      }}
    >
      {onActionClick ? (
        <Tooltip title={actionLabel ?? title}>
          <CardActionArea onClick={onActionClick} sx={{ height: "100%", alignItems: "stretch" }}>
            {content}
          </CardActionArea>
        </Tooltip>
      ) : (
        content
      )}
    </Card>
  );
}
