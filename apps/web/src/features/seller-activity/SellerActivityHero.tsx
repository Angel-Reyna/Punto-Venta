import { Box, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import SecurityIcon from "@mui/icons-material/Security";

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
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(
            theme.palette.background.paper,
            0.96,
          )} 46%, ${alpha(theme.palette.success.main, 0.08)})`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={1.5}>
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
                  Panel operativo
                </Typography>
                <Typography variant="h5" fontWeight={900}>
                  Supervisa ventas, consultas y accesos en una sola línea de tiempo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Usa filtros rápidos para detectar eventos críticos y revisa cada movimiento con contexto de vendedor,
                  hora, entidad, IP y dispositivo.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72),
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Última carga
                </Typography>
                <Typography variant="body2" fontWeight={800} data-testid="seller-activity-last-updated">
                  {relativeLastUpdated}
                </Typography>
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
