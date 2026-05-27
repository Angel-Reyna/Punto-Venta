import { type ReactNode } from "react";

import { Box, Button, Card, CardContent, Typography } from "@mui/material";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useNavigate } from "react-router-dom";

export function DashboardPanelCard({
  title,
  subtitle,
  actionTo,
  children
}: {
  title: string;
  subtitle?: string;
  actionTo?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)"
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            mb: 2
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {title}
            </Typography>

            {subtitle && (
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {actionTo && (
            <Button
              endIcon={<ChevronRightIcon />}
              onClick={() => navigate(actionTo)}
              size="small"
              sx={{ whiteSpace: "nowrap" }}
            >
              Ver
            </Button>
          )}
        </Box>

        {children}
      </CardContent>
    </Card>
  );
}
