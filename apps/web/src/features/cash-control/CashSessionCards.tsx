import { Box, Button, Card, CardContent, Divider, Grid, TextField, Typography } from "@mui/material";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import {
  CASH_INFO_TEXT,
  type CashRegisterSession,
  formatDate,
  formatMoney,
} from "./cashRegisterShared";

export function CashSessionCards({
  canOperateCashRegister,
  closeRegister,
  closeRegisterDisabledReason,
  closingAmount,
  closingNotes,
  currentSession,
  isLoading,
  openRegister,
  openRegisterDisabledReason,
  openingAmount,
  openingNotes,
  setClosingAmount,
  setClosingNotes,
  setOpeningAmount,
  setOpeningNotes,
}: {
  canOperateCashRegister: boolean;
  closeRegister: () => void;
  closeRegisterDisabledReason: string;
  closingAmount: string;
  closingNotes: string;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
  openRegister: () => void;
  openRegisterDisabledReason: string;
  openingAmount: string;
  openingNotes: string;
  setClosingAmount: (value: string) => void;
  setClosingNotes: (value: string) => void;
  setOpeningAmount: (value: string) => void;
  setOpeningNotes: (value: string) => void;
}) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} mb={1}>
              Estado actual
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {currentSession ? (
              <Box sx={{ display: "grid", gap: 1 }}>
                <Typography>Apertura: {formatDate(currentSession.openedAt)}</Typography>
                <Typography>
                  Monto inicial: {formatMoney(currentSession.openingAmount)}
                </Typography>
                <Typography>
                  <LabelWithInfo
                    label="Efectivo esperado"
                    info={CASH_INFO_TEXT.expectedCash}
                    ariaLabel={CASH_INFO_TEXT.expectedCash}
                  />
                  : {formatMoney(currentSession.expectedCash)}
                </Typography>
                <Typography color="text.secondary">
                  {currentSession.notes || "Sin notas de apertura."}
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">
                No tienes una caja abierta. Abre caja antes de iniciar el turno para
                controlar efectivo.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} mb={1}>
              Abrir caja
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Monto inicial"
                type="number"
                value={openingAmount}
                disabled={!canOperateCashRegister || Boolean(currentSession)}
                inputProps={{ "data-testid": "cash-opening-amount", min: 0, step: "0.01" }}
                onChange={(event) => setOpeningAmount(event.target.value)}
              />

              <TextField
                label="Notas de apertura"
                value={openingNotes}
                disabled={!canOperateCashRegister || Boolean(currentSession)}
                multiline
                minRows={2}
                inputProps={{ "data-testid": "cash-opening-notes" }}
                onChange={(event) => setOpeningNotes(event.target.value)}
              />

              <Box>
                <Button
                  fullWidth
                  data-testid="cash-open-button"
                  onClick={openRegister}
                  disabled={!canOperateCashRegister || Boolean(currentSession) || isLoading}
                >
                  Abrir caja
                </Button>
                <ActionDisabledReason message={openRegisterDisabledReason} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} mb={1}>
              Cerrar caja
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                label={
                  <LabelWithInfo
                    label="Monto contado"
                    info={CASH_INFO_TEXT.countedCash}
                    ariaLabel={CASH_INFO_TEXT.countedCash}
                  />
                }
                type="number"
                value={closingAmount}
                disabled={!canOperateCashRegister || !currentSession}
                inputProps={{ "data-testid": "cash-closing-amount", min: 0, step: "0.01" }}
                helperText={
                  currentSession
                    ? `Esperado: ${formatMoney(currentSession.expectedCash)}`
                    : "Primero abre caja."
                }
                onChange={(event) => setClosingAmount(event.target.value)}
              />

              <TextField
                label="Notas de cierre"
                value={closingNotes}
                disabled={!canOperateCashRegister || !currentSession}
                multiline
                minRows={2}
                inputProps={{ "data-testid": "cash-closing-notes" }}
                onChange={(event) => setClosingNotes(event.target.value)}
              />

              <Box>
                <Button
                  fullWidth
                  color="warning"
                  data-testid="cash-close-button"
                  onClick={closeRegister}
                  disabled={!canOperateCashRegister || !currentSession || isLoading}
                >
                  Cerrar caja
                </Button>
                <ActionDisabledReason message={closeRegisterDisabledReason} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
