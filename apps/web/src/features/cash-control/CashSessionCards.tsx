import { Box, Button, Card, CardContent, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import {
  CASH_INFO_TEXT,
  type CashRegisterSession,
  formatDate,
  formatMoney,
} from "./cashRegisterShared";

function SectionStep({ label, title }: { label: string; title: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
          color: "primary.main",
          fontWeight: 950,
          flexShrink: 0,
        })}
      >
        {label}
      </Box>
      <Typography variant="h6" fontWeight={900}>
        {title}
      </Typography>
    </Stack>
  );
}

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
    <Grid container spacing={2} sx={{ mb: 2.25 }} alignItems="stretch">
      <Grid item xs={12} lg={4}>
        <Card sx={{ height: "100%" }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={1.75}>
              <SectionStep label="1" title="Estado actual" />

              <Typography color="text.secondary" variant="body2">
                Revisa si hay un corte activo antes de abrir, mover o cerrar efectivo.
              </Typography>

              <Divider />

              {currentSession ? (
                <Box sx={{ display: "grid", gap: 1.1 }}>
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
                  <Box
                    sx={(theme) => ({
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
                      border: "1px solid",
                      borderColor: alpha(theme.palette.success.main, 0.22),
                      p: 1.25,
                    })}
                  >
                    <Typography color="text.secondary">
                      {currentSession.notes || "Sin notas de apertura."}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No tienes una caja abierta. Abre caja antes de iniciar el turno para
                  controlar efectivo.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card sx={{ height: "100%" }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={1.75}>
              <SectionStep label="2" title="Abrir caja" />

              <Typography color="text.secondary" variant="body2">
                Registra el efectivo inicial para que el cierre pueda compararse contra
                el dinero esperado.
              </Typography>

              <Divider />

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
                    variant="contained"
                    data-testid="cash-open-button"
                    onClick={openRegister}
                    disabled={!canOperateCashRegister || Boolean(currentSession) || isLoading}
                  >
                    Abrir caja
                  </Button>
                  <ActionDisabledReason message={openRegisterDisabledReason} />
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card sx={{ height: "100%" }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={1.75}>
              <SectionStep label="3" title="Cerrar caja" />

              <Typography color="text.secondary" variant="body2">
                Cuenta el efectivo físico y registra el cierre para detectar sobrantes o
                faltantes.
              </Typography>

              <Divider />

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
                    variant="contained"
                    data-testid="cash-close-button"
                    onClick={closeRegister}
                    disabled={!canOperateCashRegister || !currentSession || isLoading}
                  >
                    Cerrar caja
                  </Button>
                  <ActionDisabledReason message={closeRegisterDisabledReason} />
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
