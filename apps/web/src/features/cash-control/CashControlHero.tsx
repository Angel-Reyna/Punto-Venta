import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

import type { CashRegisterSession } from "./cashRegisterShared";
import { formatMoney } from "./cashRegisterShared";

export function CashControlHero({
  canReadCashRegisterSessions,
  currentSession,
}: {
  canReadCashRegisterSessions: boolean;
  currentSession: CashRegisterSession | null;
}) {
  return (
    <Card
      data-testid="cash-register-hero"
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: currentSession ? "success.light" : "divider",
        background: currentSession
          ? "linear-gradient(135deg, rgba(46, 125, 50, 0.12), rgba(255, 255, 255, 0.92))"
          : "linear-gradient(135deg, rgba(25, 118, 210, 0.10), rgba(255, 255, 255, 0.92))",
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h6" fontWeight={900} gutterBottom>
              Control de efectivo del turno
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Caja sirve para cuadrar entradas, salidas y cortes de efectivo; no
              bloquea el registro de ventas.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 2,
              }}
            >
              <Chip
                color={currentSession ? "success" : "default"}
                data-testid="cash-status-chip"
                label={currentSession ? "Caja abierta" : "Sin caja abierta"}
              />
              <Chip color="info" variant="outlined" label="Ventas sin dependencia de caja" />
              {canReadCashRegisterSessions && (
                <Chip color="primary" label="Permiso: consulta de cortes" />
              )}
            </Box>
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
                sx={{
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2,
                }}
              >
                <Typography color="text.secondary" variant="caption">
                  Efectivo esperado
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {formatMoney(currentSession?.expectedCash)}
                </Typography>
              </Box>

              <Box
                sx={{
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2,
                }}
              >
                <Typography color="text.secondary" variant="caption">
                  Movimientos actuales
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {currentSession?.movements.length ?? 0}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
