import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Tooltip,
  Typography
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import { panelTitleActionLabel } from "./dashboard.navigation";
import { type MetricCardProps, type MetricTone } from "./dashboard.types";

const CARD_BORDER_BY_TONE: Record<MetricTone, string> = {
  default: "#e2e8f0",
  info: "#38bdf8",
  success: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444"
};

const CARD_BACKGROUND_BY_TONE: Record<MetricTone, string> = {
  default: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  info: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)",
  success: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
  warning: "linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)",
  critical: "linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)"
};

export function DashboardMetricCard({
  title,
  value,
  description,
  icon,
  to,
  tone = "default",
  footer
}: MetricCardProps) {
  const navigate = useNavigate();

  const content = (
    <CardContent
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2
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
                xs: "1.8rem",
                md: "2.1rem"
              }
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            color: CARD_BORDER_BY_TONE[tone],
            backgroundColor: "rgba(15, 23, 42, 0.04)",
            flex: "0 0 auto"
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
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        borderTop: "4px solid",
        borderTopColor: CARD_BORDER_BY_TONE[tone],
        background: CARD_BACKGROUND_BY_TONE[tone],
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
        overflow: "hidden"
      }}
    >
      {to ? (
        <Tooltip title={panelTitleActionLabel(to)}>
          <CardActionArea
            onClick={() => navigate(to)}
            sx={{ height: "100%", alignItems: "stretch" }}
          >
            {content}
          </CardActionArea>
        </Tooltip>
      ) : (
        content
      )}
    </Card>
  );
}
