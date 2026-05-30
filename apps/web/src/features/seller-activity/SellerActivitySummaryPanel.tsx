import { Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { EmptySummaryMessage, SummaryCard, type SummaryItem } from "./sellerActivityShared";

export function SellerActivitySummaryPanel({ summary }: { summary: SummaryItem[] }) {
  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={900}>
              Resumen por acción
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Úsalo para ver si predominan ventas, consultas o intentos bloqueados.
            </Typography>
          </Stack>
          {summary.length === 0 ? (
            <EmptySummaryMessage />
          ) : (
            <Stack spacing={1}>
              {summary.map((item) => (
                <SummaryCard key={item.action} item={item} />
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
