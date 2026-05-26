import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography
} from "@mui/material";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { DataGridCard } from "../components/DataGridCard";
import { LabelWithInfo } from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { StatusFeedback } from "../components/StatusFeedback";
import { getApiErrorMessage } from "../utils/apiError";
import {
  buildCurrentMovementsColumns,
  buildSessionColumns,
  CASH_INFO_TEXT,
  type CashRegisterSession,
  formatDate,
  formatMoney,
  getCloseRegisterDisabledReason,
  getManualMovementDisabledReason,
  getOpenRegisterDisabledReason,
  isManualMovementSubmitDisabled
} from "./cash-register/cashRegisterShared";

export function CashRegisterPage() {
  const { can } = useAuth();

  const canOperateCashRegister = can(PERMISSIONS.CashRegisterOperate);
  const canManageCashRegister = can(PERMISSIONS.CashRegisterManage);
  const canReadCashRegisterSessions = can(PERMISSIONS.CashRegisterRead);

  const [currentSession, setCurrentSession] =
    useState<CashRegisterSession | null>(null);
  const [sessions, setSessions] = useState<CashRegisterSession[]>([]);

  const [openingAmount, setOpeningAmount] = useState("0");
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState("0");
  const [closingNotes, setClosingNotes] = useState("");
  const [movementType, setMovementType] = useState<"CASH_IN" | "CASH_OUT">(
    "CASH_IN"
  );
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setIsLoading(true);

      const [currentResponse, sessionsResponse] = await Promise.all([
        canOperateCashRegister
          ? api.get<{ session: CashRegisterSession | null }>(
              "/cash-register/current"
            )
          : Promise.resolve({ data: { session: null } }),
        canReadCashRegisterSessions
          ? api.get<CashRegisterSession[]>(
              "/cash-register/sessions?page=1&pageSize=50"
            )
          : Promise.resolve({ data: [] as CashRegisterSession[] })
      ]);

      setCurrentSession(currentResponse.data.session);
      setSessions(sessionsResponse.data);

      if (currentResponse.data.session) {
        setClosingAmount(
          String(currentResponse.data.session.expectedCash ?? 0)
        );
      }
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar la información de caja. Intenta actualizar la página."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [canOperateCashRegister, canReadCashRegisterSessions]);

  async function openRegister() {
    setMessage("");
    setError("");

    const amount = Number(openingAmount);

    if (!canOperateCashRegister) {
      setError("No tienes permiso para operar caja.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError("El monto inicial debe ser un número válido mayor o igual a cero.");
      return;
    }

    try {
      await api.post("/cash-register/open", {
        openingAmount: amount,
        notes: openingNotes.trim() || undefined
      });

      setMessage("Caja abierta correctamente.");
      setOpeningAmount("0");
      setOpeningNotes("");
      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo abrir la caja. Verifica el monto inicial.")
      );
    }
  }

  async function closeRegister() {
    setMessage("");
    setError("");

    const amount = Number(closingAmount);

    if (!canOperateCashRegister) {
      setError("No tienes permiso para operar caja.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError("El monto contado debe ser un número válido mayor o igual a cero.");
      return;
    }

    try {
      await api.post("/cash-register/close", {
        closingAmount: amount,
        notes: closingNotes.trim() || undefined
      });

      setMessage("Caja cerrada correctamente.");
      setClosingNotes("");
      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo cerrar la caja. Verifica el monto contado.")
      );
    }
  }

  async function addManualMovement() {
    setMessage("");
    setError("");

    const amount = Number(movementAmount);

    if (!canManageCashRegister) {
      setError("No tienes permiso para registrar movimientos manuales de efectivo.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("El monto del movimiento debe ser mayor a cero.");
      return;
    }

    if (movementReason.trim().length < 3) {
      setError("Describe el motivo del movimiento de efectivo.");
      return;
    }

    try {
      await api.post("/cash-register/movements", {
        type: movementType,
        amount,
        reason: movementReason.trim()
      });

      setMessage("Movimiento de efectivo registrado correctamente.");
      setMovementAmount("");
      setMovementReason("");
      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo registrar el movimiento de efectivo.")
      );
    }
  }

  const currentMovementsColumns = useMemo(buildCurrentMovementsColumns, []);

  const openRegisterDisabledReason = getOpenRegisterDisabledReason({
    canOperateCashRegister,
    currentSession,
    isLoading
  });

  const closeRegisterDisabledReason = getCloseRegisterDisabledReason({
    canOperateCashRegister,
    currentSession,
    isLoading
  });

  const manualMovementDisabledReason = getManualMovementDisabledReason({
    canOperateCashRegister,
    currentSession,
    isLoading,
    movementAmount,
    movementReason
  });

  const manualMovementSubmitDisabled = isManualMovementSubmitDisabled({
    canOperateCashRegister,
    currentSession,
    isLoading,
    movementAmount,
    movementReason
  });

  const sessionColumns = useMemo(buildSessionColumns, []);

  return (
    <>
      <PageHeader
        title="Caja"
        subtitle="Abre, controla y cierra tu caja diaria con movimientos trazables."
      />

      <Card
        data-testid="cash-register-hero"
        sx={{
          mb: 2,
          border: "1px solid",
          borderColor: currentSession ? "success.light" : "divider",
          background: currentSession
            ? "linear-gradient(135deg, rgba(46, 125, 50, 0.12), rgba(255, 255, 255, 0.92))"
            : "linear-gradient(135deg, rgba(25, 118, 210, 0.10), rgba(255, 255, 255, 0.92))"
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
                  mt: 2
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
                  gap: 1.5
                }}
              >
                <Box
                  sx={{
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    p: 2
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
                    p: 2
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

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

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
                  <Typography>
                    Apertura: {formatDate(currentSession.openedAt)}
                  </Typography>
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
                  No tienes una caja abierta. Abre caja antes de iniciar el turno
                  para controlar efectivo.
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

      {canManageCashRegister && (
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
                  md: "180px 180px 1fr 180px"
                },
                gap: 2
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
                  setMovementType(event.target.value as "CASH_IN" | "CASH_OUT")
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
      )}

      <DataGridCard
        title="Movimientos de la caja actual"
        rows={currentSession?.movements ?? []}
        columns={currentMovementsColumns}
        minWidth={840}
        loading={isLoading}
        cardSx={{ mb: 2 }}
        noRowsLabel="No hay movimientos en la caja actual."
        tableLabel="Movimientos de la caja actual"
      />

      {canReadCashRegisterSessions && (
        <DataGridCard
          title="Cortes recientes"
          rows={sessions}
          columns={sessionColumns}
          minWidth={1120}
          loading={isLoading}
          noRowsLabel="No hay cortes de caja registrados."
          tableLabel="Cortes recientes"
        />
      )}
    </>
  );
}
