import type { ReactNode } from "react";

import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export type SectionCardProps = {
  action?: ReactNode;
  actionLabel?: string;
  children: ReactNode;
  onActionClick?: () => void;
  subtitle?: string;
  sx?: SxProps<Theme>;
  title?: string;
};

export function SectionCard({
  action,
  actionLabel = "Ver",
  children,
  onActionClick,
  subtitle,
  sx,
  title,
}: SectionCardProps) {
  const hasHeader = Boolean(title || subtitle || action || onActionClick);

  return (
    <Card
      sx={[
        {
          height: "100%",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <CardContent>
        {hasHeader && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography variant="h6" fontWeight={900}>
                  {title}
                </Typography>
              )}

              {subtitle && (
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>

            {action ??
              (onActionClick ? (
                <Button
                  endIcon={<ChevronRightIcon />}
                  onClick={onActionClick}
                  size="small"
                  sx={{ alignSelf: { xs: "flex-start", sm: "center" }, whiteSpace: "nowrap" }}
                >
                  {actionLabel}
                </Button>
              ) : null)}
          </Stack>
        )}

        {children}
      </CardContent>
    </Card>
  );
}
