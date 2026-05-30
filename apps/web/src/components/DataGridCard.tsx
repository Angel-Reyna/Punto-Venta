import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  type SxProps,
  type Theme
} from "@mui/material";
import type { GridValidRowModel } from "@mui/x-data-grid";

import { AppDataGrid, type AppDataGridProps } from "./AppDataGrid";

function asSxArray(sx?: SxProps<Theme>) {
  if (!sx) return [];

  return Array.isArray(sx) ? sx : [sx];
}

export type DataGridCardProps<R extends GridValidRowModel = GridValidRowModel> = AppDataGridProps<R> & {
  title?: string;
  subtitle?: string;
  minWidth?: number | string;
  tableLabel?: string;
  cardSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

export function DataGridCard<R extends GridValidRowModel = GridValidRowModel>({
  title,
  subtitle,
  minWidth,
  tableLabel,
  cardSx,
  contentSx,
  ...dataGridProps
}: DataGridCardProps<R>) {
  return (
    <Card sx={cardSx}>
      <CardContent
        sx={[
          {
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
            px: { xs: 1.5, sm: 2.35 },
            "&::-webkit-scrollbar": {
              height: 8
            },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 999,
              backgroundColor: "divider"
            }
          },
          ...asSxArray(contentSx)
        ]}
      >
        {(title || subtitle) && (
          <Stack spacing={0.5} sx={{ mb: 1.75 }}>
            {title && (
              <Typography variant="h6" fontWeight={850}>
                {title}
              </Typography>
            )}

            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
        )}

        <Box sx={{ minWidth: minWidth ?? 0 }}>
          <AppDataGrid
            aria-label={tableLabel ?? title ?? "Tabla de datos"}
            {...dataGridProps}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
