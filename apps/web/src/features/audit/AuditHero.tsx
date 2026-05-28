import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";

export function AuditHero({
  criticalEvents,
  latestEvent,
  visibleCount,
}: {
  criticalEvents: number;
  latestEvent: string;
  visibleCount: number;
}) {
  return (
    <Card
      sx={{
        mb: 2,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        background:
          "linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(237, 108, 2, 0.08) 52%, rgba(211, 47, 47, 0.09))",
      }}
    >
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
          <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip color="primary" label="Acceso exclusivo ADMIN" icon={<SecurityIcon />} />
              <Chip
                color={criticalEvents > 0 ? "error" : "success"}
                variant="outlined"
                label={`${criticalEvents} críticos visibles`}
              />
            </Stack>

            <Typography variant="h5" fontWeight={950}>
              Centro de investigación operativa
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Prioriza eventos críticos, identifica al actor y compara el antes/después sin perder contexto.
              La auditoría debe servir para responder qué cambió, quién lo hizo y cuándo ocurrió.
            </Typography>
          </Stack>

          <Stack
            spacing={0.75}
            sx={{
              minWidth: { md: 260 },
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              p: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Último evento auditable
            </Typography>
            <Typography fontWeight={900}>{latestEvent}</Typography>
            <Typography variant="caption" color="text.secondary">
              {visibleCount} evento(s) visibles con los filtros actuales
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
