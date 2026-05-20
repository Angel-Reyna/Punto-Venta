import { useEffect, useMemo, useState } from "react";

import {
  Alert,
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

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";

type CashRegisterStatus = "OPEN" | "CLOSED";
type CashMovementType =
  | "OPENING"
  | "CASH_IN"
  | "CASH_OUT"
  | "SALE_CASH"
  | "RETURN_CASH";

type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  signedAmount?: number;
  reason: string;
  createdAt: string;
};

type CashRegisterSession = {
  id: string;
  status: CashRegisterStatus;
  openingAmount: number;
  expectedClosingAmount: number | null;
  closingAmount: number | null;
  difference: number | null;
  expectedCash?: number;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  movements: CashMovement[];
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

function movementLabel(type: CashMovementType) {
  switch (type) {
    case "OPENING":
      return "Apertura";
    case "CASH_IN":
      return "Entrada manual";
    case "CASH_OUT":
      return "Salida manual";
    case "SALE_CASH":
      return "Venta en efectivo";
    case "RETURN_CASH":
      return "Devolución en efectivo";
    default:
      return type;
  }
}

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

  const currentMovementsColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "createdAt",
        headerName: "Fecha",
        width: 180,
        valueFormatter: (value) => formatDate(value as string)
      },
      {
        field: "type",
        headerName: "Tipo",
        width: 180,
        valueFormatter: (value) => movementLabel(value as CashMovementType)
      },
      {
        field: "reason",
        headerName: "Motivo",
        flex: 1,
        minWidth: 240
      },
      {
        field: "signedAmount",
        headerName: "Importe",
        width: 140,
        valueGetter: (_value, row) => row.signedAmount ?? row.amount,
        valueFormatter: (value) => formatMoney(Number(value))
      }
    ],
    []
  );

  const sessionColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "openedAt",
        headerName: "Apertura",
        width: 180,
        valueFormatter: (value) => formatDate(value as string)
      },
      {
        field: "closedAt",
        headerName: "Cierre",
        width: 180,
        valueFormatter: (value) => formatDate(value as string | null)
      },
      {
        field: "cashier",
        headerName: "Cajero",
        flex: 1,
        minWidth: 220,
        valueGetter: (_value, row) =>
          row.cashier ? `${row.cashier.name} (${row.cashier.email})` : "—"
      },
      {
        field: "status",
        headerName: "Estado",
        width: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value === "OPEN" ? "Abierta" : "Cerrada"}
            color={params.value === "OPEN" ? "success" : "default"}
          />
        )
      },
      {
        field: "openingAmount",
        headerName: "Inicial",
        width: 130,
        valueFormatter: (value) => formatMoney(Number(value))
      },
      {
        field: "expectedClosingAmount",
        headerName: "Esperado",
        width: 130,
        valueFormatter: (value) => formatMoney(value as number | null)
      },
      {
        field: "closingAmount",
        headerName: "Contado",
        width: 130,
        valueFormatter: (value) => formatMoney(value as number | null)
      },
      {
        field: "difference",
        headerName: "Diferencia",
        width: 130,
        valueFormatter: (value) => formatMoney(value as number | null)
      }
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Caja"
        subtitle="Abre, controla y cierra tu caja diaria con movimientos trazables."
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={currentSession ? "success" : "default"}
          label={currentSession ? "Caja abierta" : "Sin caja abierta"}
        />
        {canReadCashRegisterSessions && (
          <Chip sx={{ ml: 1 }} color="primary" label="Permiso: consulta de cortes" />
        )}
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
                    Efectivo esperado: {formatMoney(currentSession.expectedCash)}
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
                  inputProps={{ min: 0, step: "0.01" }}
                  onChange={(event) => setOpeningAmount(event.target.value)}
                />

                <TextField
                  label="Notas de apertura"
                  value={openingNotes}
                  disabled={!canOperateCashRegister || Boolean(currentSession)}
                  multiline
                  minRows={2}
                  onChange={(event) => setOpeningNotes(event.target.value)}
                />

                <Button
                  onClick={openRegister}
                  disabled={!canOperateCashRegister || Boolean(currentSession) || isLoading}
                >
                  Abrir caja
                </Button>
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
                  label="Monto contado"
                  type="number"
                  value={closingAmount}
                  disabled={!canOperateCashRegister || !currentSession}
                  inputProps={{ min: 0, step: "0.01" }}
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
                  onChange={(event) => setClosingNotes(event.target.value)}
                />

                <Button
                  color="warning"
                  onClick={closeRegister}
                  disabled={!canOperateCashRegister || !currentSession || isLoading}
                >
                  Cerrar caja
                </Button>
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
                label="Tipo"
                value={movementType}
                disabled={!canOperateCashRegister || !currentSession}
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
                inputProps={{ min: 0.01, step: "0.01" }}
                onChange={(event) => setMovementAmount(event.target.value)}
              />

              <TextField
                label="Motivo"
                value={movementReason}
                disabled={!canOperateCashRegister || !currentSession}
                onChange={(event) => setMovementReason(event.target.value)}
              />

              <Button
                onClick={addManualMovement}
                disabled={!canOperateCashRegister || !currentSession || isLoading}
              >
                Registrar
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ overflowX: "auto" }}>
          <Typography variant="h6" fontWeight={800} mb={2}>
            Movimientos de la caja actual
          </Typography>

          <Box sx={{ minWidth: 840 }}>
            <DataGrid
              autoHeight
              rows={currentSession?.movements ?? []}
              columns={currentMovementsColumns}
              disableRowSelectionOnClick
              loading={isLoading}
            />
          </Box>
        </CardContent>
      </Card>

      {canReadCashRegisterSessions && (
        <Card>
          <CardContent sx={{ overflowX: "auto" }}>
            <Typography variant="h6" fontWeight={800} mb={2}>
              Cortes recientes
            </Typography>

            <Box sx={{ minWidth: 1120 }}>
              <DataGrid
                autoHeight
                rows={sessions}
                columns={sessionColumns}
                disableRowSelectionOnClick
                loading={isLoading}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
}
