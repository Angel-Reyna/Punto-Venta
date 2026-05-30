import { useMemo } from "react";

import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { DataGridCard } from "../../components/DataGridCard";
import {
  buildCurrentMovementsColumns,
  buildSessionColumns,
  type CashMovement,
  type CashRegisterSession,
  formatDate,
  formatMoney,
  movementLabel,
} from "./cashRegisterShared";

function MovementCard({ movement }: { movement: CashMovement }) {
  const signedAmount = movement.signedAmount ?? movement.amount;
  const isPositive = signedAmount >= 0;

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.75 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900}>{movementLabel(movement.type)}</Typography>
              <Typography color="text.secondary" variant="caption">
                {formatDate(movement.createdAt)}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={isPositive ? "success" : "warning"}
              label={formatMoney(signedAmount)}
            />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            {movement.reason || "Sin motivo registrado."}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SessionCard({ session }: { session: CashRegisterSession }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.75 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900} noWrap>
                {session.cashier?.name ?? "Vendedor sin asignar"}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Apertura: {formatDate(session.openedAt)}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={session.status === "OPEN" ? "Abierta" : "Cerrada"}
              color={session.status === "OPEN" ? "success" : "default"}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="caption">
                Esperado
              </Typography>
              <Typography fontWeight={850}>
                {formatMoney(session.expectedClosingAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography color="text.secondary" variant="caption">
                Contado
              </Typography>
              <Typography fontWeight={850}>{formatMoney(session.closingAmount)}</Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function CashMovementsSection({
  canReadCashRegisterSessions,
  currentSession,
  isLoading,
  sessions,
}: {
  canReadCashRegisterSessions: boolean;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
  sessions: CashRegisterSession[];
}) {
  const currentMovementsColumns = useMemo(buildCurrentMovementsColumns, []);
  const sessionColumns = useMemo(buildSessionColumns, []);
  const currentMovements = currentSession?.movements ?? [];

  return (
    <Stack spacing={2.25}>
      <Box>
        <Box sx={{ mb: 1.25 }}>
          <Typography variant="h6" fontWeight={900}>
            Movimientos de efectivo
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Revisa entradas, salidas, ventas en efectivo y devoluciones del corte actual.
          </Typography>
        </Box>

        <Box sx={{ display: { xs: "block", md: "none" } }}>
          {currentMovements.length > 0 ? (
            <Grid container spacing={1.25}>
              {currentMovements.map((movement) => (
                <Grid item xs={12} sm={6} key={movement.id}>
                  <MovementCard movement={movement} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card
              variant="outlined"
              sx={(theme) => ({
                borderStyle: "dashed",
                bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.24 : 0.6),
              })}
            >
              <CardContent>
                <Typography color="text.secondary">
                  No hay movimientos en la caja actual.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        <DataGridCard
          title="Movimientos de la caja actual"
          subtitle="Vista detallada para revisar importes, motivos y horario exacto."
          rows={currentMovements}
          columns={currentMovementsColumns}
          minWidth={840}
          loading={isLoading}
          cardSx={{ display: { xs: "none", md: "block" } }}
          noRowsLabel="No hay movimientos en la caja actual."
          tableLabel="Movimientos de la caja actual"
        />
      </Box>

      {canReadCashRegisterSessions && (
        <Box>
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="h6" fontWeight={900}>
              Cortes recientes
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Consulta cierres anteriores para comparar efectivo esperado, contado y diferencia.
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {sessions.length > 0 ? (
              <Grid container spacing={1.25}>
                {sessions.map((session) => (
                  <Grid item xs={12} sm={6} key={session.id}>
                    <SessionCard session={session} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Card
                variant="outlined"
                sx={(theme) => ({
                  borderStyle: "dashed",
                  bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.24 : 0.6),
                })}
              >
                <CardContent>
                  <Typography color="text.secondary">
                    No hay cortes de caja registrados.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>

          <DataGridCard
            title="Cortes recientes"
            subtitle="Historial administrativo de aperturas y cierres de caja."
            rows={sessions}
            columns={sessionColumns}
            minWidth={1120}
            loading={isLoading}
            cardSx={{ display: { xs: "none", md: "block" } }}
            noRowsLabel="No hay cortes de caja registrados."
            tableLabel="Cortes recientes"
          />
        </Box>
      )}
    </Stack>
  );
}
