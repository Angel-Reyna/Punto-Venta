import { Box, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import SensorsIcon from "@mui/icons-material/Sensors";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";

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
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.24),
        background: `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.22)}, transparent 34%), linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.98,
        )}, ${alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.18 : 0.08)})`,
      })}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2.5} alignItems="stretch">
          <Grid item xs={12} md={7.5}>
            <Stack spacing={2} sx={{ height: "100%", justifyContent: "center" }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="primary" label="Control del equipo" icon={<SupervisorAccountOutlinedIcon />} sx={{ fontWeight: 900 }} />
                <Chip color="primary" variant="outlined" label="Solo ADMIN" icon={<SecurityIcon />} />
                <Chip
                  color={isAutoRefreshPaused ? "warning" : "success"}
                  variant={isAutoRefreshPaused ? "filled" : "outlined"}
                  data-testid="seller-activity-refresh-status"
                  label={isAutoRefreshPaused ? "Auto-refresh pausado" : "Auto-refresh activo"}
                />
              </Stack>

              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={900}>
                  Pulso visual del equipo
                </Typography>
                <Typography variant="h4" fontWeight={950} sx={{ maxWidth: 820, lineHeight: 1.08 }}>
                  Entiende la operación de tus vendedores sin leer registros técnicos
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 820 }}>
                  La pantalla separa eventos, vendedores y señales para que puedas detectar ventas, bloqueos y actividad relevante con una lectura rápida.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4.5}>
            <Stack
              spacing={1.5}
              sx={(theme) => ({
                height: "100%",
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.74 : 0.82),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.16),
                boxShadow: `0 18px 44px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.26 : 0.08)}`,
              })}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={(theme) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    color: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    flexShrink: 0,
                  })}
                >
                  <SensorsIcon />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Última carga
                  </Typography>
                  <Typography variant="body2" fontWeight={950} data-testid="seller-activity-last-updated">
                    {relativeLastUpdated}
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Stack direction="row" spacing={1.25} alignItems="center">
                <AutoGraphOutlinedIcon color="action" fontSize="small" />
                <Typography variant="caption" color="text.secondary" data-testid="seller-activity-refresh-helper">
                  {isAutoRefreshPaused
                    ? "Actualización automática detenida. Usa Actualizar ahora para consultar sin perder filtros."
                    : `Actualización automática cada ${autoRefreshIntervalSeconds} segundos sin reiniciar búsqueda ni filtros.`}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
