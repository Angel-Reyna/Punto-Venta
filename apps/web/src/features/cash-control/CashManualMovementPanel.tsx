import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from "@mui/material";

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
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={800} mb={1}>
          Movimiento manual de efectivo
        </Typography>

        <Typography color="text.secondary" variant="body2" mb={2}>
          Usa esta sección para registrar entradas o salidas justificadas de
          efectivo. Requiere caja abierta.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "180px 180px 1fr 180px",
            },
            gap: 2,
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
            onChange={(event) => setMovementReason(event.target.value)}
          />

          <Box>
            <Button
              fullWidth
              data-testid="cash-manual-submit"
              onClick={addManualMovement}
              disabled={manualMovementSubmitDisabled}
            >
              Registrar
            </Button>
            <ActionDisabledReason message={manualMovementDisabledReason} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
