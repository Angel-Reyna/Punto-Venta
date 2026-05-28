import { Card, CardContent, Stack, Typography } from "@mui/material";

import { EmptySummaryMessage, SummaryCard, type SummaryItem } from "./sellerActivityShared";

export function SellerActivitySummaryPanel({ summary }: { summary: SummaryItem[] }) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6" fontWeight={900}>
            Resumen por acción
          </Typography>
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
