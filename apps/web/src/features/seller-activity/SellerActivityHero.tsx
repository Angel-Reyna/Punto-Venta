import { Box, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import SecurityIcon from "@mui/icons-material/Security";
import SensorsIcon from "@mui/icons-material/Sensors";

export function SellerActivityHero({
  autoRefreshIntervalSeconds,
  isAutoRefreshPaused,
  relativeLastUpdated,
}: {
  autoRefreshIntervalSeconds: number;
  isAutoRefreshPaused: boolean;
  relativeLastUpdated: string;
}) {
  return (
    <Card
      sx={{
        mb: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(
            theme.palette.background.paper,
            0.98,
          )} 52%, ${alpha(theme.palette.success.main, 0.1)})`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2.5} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <Stack spacing={1.5} sx={{ height: "100%", justifyContent: "center" }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="primary" label="Acceso exclusivo ADMIN" icon={<SecurityIcon />} />
                <Chip
                  color={isAutoRefreshPaused ? "warning" : "success"}
                  variant="outlined"
                  data-testid="seller-activity-refresh-status"
                  label={isAutoRefreshPaused ? "Auto-refresh pausado" : "Auto-refresh activo"}
                />
              </Stack>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Pulso del equipo
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ maxWidth: 760 }}>
                  Revisa qué hizo cada vendedor sin leer una bitácora técnica
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                  La vista resume ventas, consultas, accesos y bloqueos para que el dueño detecte actividad relevante y
                  revise solo lo que necesita atención.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack
              spacing={1.5}
              sx={{
                height: "100%",
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.76),
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    color: "primary.main",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    flexShrink: 0,
                  }}
                >
                  <SensorsIcon />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Última carga
                  </Typography>
                  <Typography variant="body2" fontWeight={900} data-testid="seller-activity-last-updated">
                    {relativeLastUpdated}
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Typography variant="caption" color="text.secondary" data-testid="seller-activity-refresh-helper">
                {isAutoRefreshPaused
                  ? "Actualización automática detenida. Usa Actualizar ahora para consultar sin perder filtros."
                  : `Actualización automática cada ${autoRefreshIntervalSeconds} segundos sin reiniciar búsqueda ni filtros.`}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
