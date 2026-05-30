import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { CashRegisterSession } from "./cashRegisterShared";
import { formatMoney } from "./cashRegisterShared";

export function CashControlHero({
  canReadCashRegisterSessions,
  currentSession,
}: {
  canReadCashRegisterSessions: boolean;
  currentSession: CashRegisterSession | null;
}) {
  const isOpen = Boolean(currentSession);

  return (
    <Card
      data-testid="cash-register-hero"
      sx={(theme) => {
        const tone = isOpen ? theme.palette.success.main : theme.palette.info.main;
        const isDark = theme.palette.mode === "dark";

        return {
          mb: 2.25,
          borderRadius: 4,
          border: "1px solid",
          borderColor: alpha(tone, isDark ? 0.28 : 0.2),
          background: isDark
            ? `linear-gradient(135deg, ${alpha(tone, 0.16)}, ${alpha(
                theme.palette.background.paper,
                0.96,
              )})`
            : `linear-gradient(135deg, ${alpha(tone, 0.1)}, ${alpha(
                theme.palette.background.paper,
                0.98,
              )})`,
          boxShadow: isDark
            ? "0 18px 44px rgba(0, 0, 0, 0.22)"
            : "0 18px 44px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        };
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.75 } }}>
        <Grid container spacing={2.25} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={1.35}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  color={currentSession ? "success" : "default"}
                  data-testid="cash-status-chip"
                  label={currentSession ? "Caja abierta" : "Sin caja abierta"}
                />
                <Chip color="info" variant="outlined" label="Control secundario" />
                {canReadCashRegisterSessions && (
                  <Chip color="primary" variant="outlined" label="Consulta de cortes" />
                )}
              </Stack>

              <Box>
                <Typography variant="h5" fontWeight={950} gutterBottom>
                  Control de efectivo del turno
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                  Usa Caja para cuadrar efectivo, registrar entradas o salidas y cerrar
                  cortes. Las ventas siguen funcionando aunque no haya caja abierta.
                </Typography>
              </Box>

              <Box
                sx={(theme) => ({
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.info.main, 0.22),
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.5 : 0.72),
                  p: 1.4,
                })}
              >
                <Typography variant="body2" fontWeight={850}>
                  Flujo recomendado: abre caja al iniciar el turno, registra movimientos
                  manuales con motivo y cierra caja con el efectivo contado.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Box
                sx={(theme) => ({
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.74 : 0.86),
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2,
                })}
              >
                <Typography color="text.secondary" variant="caption">
                  Efectivo esperado
                </Typography>
                <Typography variant="h6" fontWeight={950}>
                  {formatMoney(currentSession?.expectedCash)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Sistema: inicial + entradas - salidas.
                </Typography>
              </Box>

              <Box
                sx={(theme) => ({
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.74 : 0.86),
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2,
                })}
              >
                <Typography color="text.secondary" variant="caption">
                  Movimientos actuales
                </Typography>
                <Typography variant="h6" fontWeight={950}>
                  {currentSession?.movements.length ?? 0}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Entradas, salidas y ventas en efectivo.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
