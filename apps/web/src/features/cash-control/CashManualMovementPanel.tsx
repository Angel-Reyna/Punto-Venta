import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import { CASH_INFO_TEXT, type CashRegisterSession } from "./cashRegisterShared";
import type { ManualCashMovementType } from "./useCashRegisterData";

export function CashManualMovementPanel({
  addManualMovement,
  canOperateCashRegister,
  currentSession,
  manualMovementDisabledReason,
  manualMovementSubmitDisabled,
  movementAmount,
  movementReason,
  movementType,
  setMovementAmount,
  setMovementReason,
  setMovementType,
}: {
  addManualMovement: () => void;
  canOperateCashRegister: boolean;
  currentSession: CashRegisterSession | null;
  manualMovementDisabledReason: string;
  manualMovementSubmitDisabled: boolean;
  movementAmount: string;
  movementReason: string;
  movementType: ManualCashMovementType;
  setMovementAmount: (value: string) => void;
  setMovementReason: (value: string) => void;
  setMovementType: (value: ManualCashMovementType) => void;
}) {
  return (
    <Card sx={{ mb: 2.25 }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={900} gutterBottom>
              Movimiento manual de efectivo
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Registra entradas o salidas que no vienen de una venta. Siempre agrega un
              motivo claro para que el corte y la auditoría sean entendibles.
            </Typography>
          </Box>

          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.25,
              p: 1.25,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.3 : 0.62),
            })}
          >
            <Box>
              <Typography fontWeight={850} variant="body2">
                Entrada
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Suma efectivo a la caja: fondo adicional, cambio recibido o ajuste
                justificado.
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={850} variant="body2">
                Salida
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Resta efectivo de la caja: entrega, retiro o salida documentada.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(150px, 180px) minmax(150px, 180px)",
                lg: "180px 180px 1fr 180px",
              },
              gap: 2,
              alignItems: "start",
            }}
          >
            <TextField
              select
              label={
                <LabelWithInfo
                  label="Tipo"
                  info={CASH_INFO_TEXT.movementType}
                  ariaLabel={CASH_INFO_TEXT.movementType}
                />
              }
              value={movementType}
              disabled={!canOperateCashRegister || !currentSession}
              inputProps={{ "data-testid": "cash-movement-type" }}
              onChange={(event) =>
                setMovementType(event.target.value as ManualCashMovementType)
              }
            >
              <MenuItem value="CASH_IN">Entrada</MenuItem>
              <MenuItem value="CASH_OUT">Salida</MenuItem>
            </TextField>

            <TextField
              label="Monto"
              type="number"
              value={movementAmount}
              disabled={!canOperateCashRegister || !currentSession}
              inputProps={{ "data-testid": "cash-manual-amount", min: 0.01, step: "0.01" }}
              onChange={(event) => setMovementAmount(event.target.value)}
            />

            <TextField
              label="Motivo"
              value={movementReason}
              disabled={!canOperateCashRegister || !currentSession}
              inputProps={{ "data-testid": "cash-manual-reason" }}
              placeholder="Ej. Fondo adicional, entrega parcial, retiro autorizado"
              onChange={(event) => setMovementReason(event.target.value)}
            />

            <Box>
              <Button
                fullWidth
                variant="contained"
                data-testid="cash-manual-submit"
                onClick={addManualMovement}
                disabled={manualMovementSubmitDisabled}
                sx={{ minHeight: 48 }}
              >
                Registrar
              </Button>
              <ActionDisabledReason message={manualMovementDisabledReason} />
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
