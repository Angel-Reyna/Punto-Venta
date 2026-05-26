import type { ReactNode } from "react";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography
} from "@mui/material";

export type AuditLog = {
  id: string;
  action: string;
  tableName: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
  } | null;
};

export type AuditSeverity = "" | "critical" | "high" | "medium" | "low";

export type AuditFilters = {
  q: string;
  action: string;
  tableName: string;
  severity: AuditSeverity;
  dateFrom: string;
  dateTo: string;
};

export const initialFilters: AuditFilters = {
  q: "",
  action: "",
  tableName: "",
  severity: "",
  dateFrom: "",
  dateTo: ""
};

const SENSITIVE_KEY_PATTERN = /(password|token|secret|hash|pepper|credential|cookie|authorization)/i;

const ACTION_LABELS: Record<string, string> = {
  CASH_REGISTER_CLOSE: "Cierre de caja",
  CASH_REGISTER_MOVEMENT: "Movimiento manual de caja",
  CASH_REGISTER_OPEN: "Apertura de caja",
  INVENTORY_IN: "Entrada de inventario",
  INVENTORY_OUT: "Salida de inventario",
  PRODUCT_CREATE: "Producto creado",
  PRODUCT_DELETE: "Producto eliminado",
  PRODUCT_IMPORT: "Importación de productos",
  PRODUCT_TOGGLE_ACTIVE: "Cambio de estado de producto",
  PRODUCT_UPDATE: "Producto actualizado",
  SALE_CANCEL: "Venta cancelada",
  SALE_CREATE: "Venta registrada",
  SALE_RETURN: "Devolución registrada",
  USER_ACTIVATE: "Usuario activado",
  USER_CREATE: "Usuario creado",
  USER_DEACTIVATE: "Usuario desactivado",
  USER_PASSWORD_RESET: "Contraseña restablecida",
  USER_ROLE_UPDATE: "Rol actualizado"
};

const ENTITY_LABELS: Record<string, string> = {
  CashRegisterMovement: "Movimiento de caja",
  CashRegisterSession: "Caja",
  InventoryMovement: "Inventario",
  Product: "Producto",
  Sale: "Venta",
  SaleReturn: "Devolución",
  User: "Usuario"
};

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatRole(role?: "ADMIN" | "CASHIER") {
  if (role === "ADMIN") return "Administrador";
  if (role === "CASHIER") return "Vendedor";
  return "Sistema";
}

export function formatActionLabel(action: string) {
  return ACTION_LABELS[action] ?? titleCase(action);
}

export function formatEntityLabel(tableName: string) {
  return ENTITY_LABELS[tableName] ?? titleCase(tableName);
}

type ChipColor = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
type AuditMetricTone = "primary" | "success" | "warning" | "error" | "info";

export function getAuditSeverity(log: Pick<AuditLog, "action" | "tableName">): {
  level: Exclude<AuditSeverity, "">;
  label: string;
  helper: string;
  color: ChipColor;
} {
  const normalized = `${log.action} ${log.tableName}`.toLowerCase();

  if (
    normalized.includes("delete") ||
    normalized.includes("cancel") ||
    normalized.includes("password") ||
    normalized.includes("deactivate")
  ) {
    return {
      level: "critical",
      label: "Crítica",
      helper: "Acción destructiva, de acceso o irreversible.",
      color: "error"
    };
  }

  if (
    normalized.includes("role") ||
    normalized.includes("permission") ||
    normalized.includes("cash_register_close") ||
    normalized.includes("inventory_out") ||
    normalized.includes("return")
  ) {
    return {
      level: "high",
      label: "Alta",
      helper: "Afecta permisos, caja, inventario o devoluciones.",
      color: "warning"
    };
  }

  if (
    normalized.includes("create") ||
    normalized.includes("update") ||
    normalized.includes("import") ||
    normalized.includes("open") ||
    normalized.includes("movement")
  ) {
    return {
      level: "medium",
      label: "Media",
      helper: "Modifica datos operativos relevantes.",
      color: "info"
    };
  }

  return {
    level: "low",
    label: "Baja",
    helper: "Evento informativo o de baja criticidad.",
    color: "success"
  };
}

function getResultLabel(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("fail") || normalized.includes("blocked") || normalized.includes("denied")) {
    return { label: "Fallido / bloqueado", color: "warning" as ChipColor };
  }

  return { label: "Registrado", color: "success" as ChipColor };
}

function sanitizeAuditValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;

  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    if (depth >= 2) return `[${value.length} elemento(s)]`;
    return value.slice(0, 5).map((item) => sanitizeAuditValue(item, depth + 1));
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(0, 10);
  const sanitized: Record<string, unknown> = {};

  for (const [key, rawValue] of entries) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? "[redactado]"
      : depth >= 2
        ? summarizePrimitive(rawValue)
        : sanitizeAuditValue(rawValue, depth + 1);
  }

  return sanitized;
}

function summarizePrimitive(value: unknown) {
  if (value == null) return value;
  if (typeof value === "object") return Array.isArray(value) ? `[${value.length} elemento(s)]` : "{...}";
  return value;
}

export function summarizeAuditData(value: unknown) {
  if (value == null) return "Sin datos";

  try {
    const serialized = JSON.stringify(sanitizeAuditValue(value));
    if (!serialized || serialized === "{}") return "Sin datos";
    return serialized.length > 260 ? `${serialized.slice(0, 260)}…` : serialized;
  } catch {
    return "Datos no serializables";
  }
}

export function filterAuditLogsBySeverity(logs: AuditLog[], severity: AuditSeverity) {
  if (!severity) return logs;
  return logs.filter((log) => getAuditSeverity(log).level === severity);
}

export function buildAuditQuery(filters: AuditFilters) {
  const params = new URLSearchParams();

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.action.trim()) {
    params.set("action", filters.action.trim());
  }

  if (filters.tableName.trim()) {
    params.set("tableName", filters.tableName.trim());
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  params.set("pageSize", "100");

  return params.toString();
}

export function AuditMetricCard({
  label,
  value,
  helper,
  icon,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  helper: string;
  icon?: ReactNode;
  tone?: AuditMetricTone;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        border: 1,
        borderColor: `${tone}.light`,
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)"
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 38,
              height: 38,
              borderRadius: 2,
              color: `${tone}.main`,
              bgcolor: "background.default",
              border: 1,
              borderColor: `${tone}.light`
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>

            <Typography variant="h5" fontWeight={950} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
              {value}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function getSeverityBorderColor(color: ChipColor) {
  if (color === "default") return "divider";
  return `${color}.light`;
}

function getSeverityMainColor(color: ChipColor) {
  if (color === "default") return "text.secondary";
  return `${color}.main`;
}

export function AuditLogCard({ log }: { log: AuditLog }) {
  const severity = getAuditSeverity(log);
  const result = getResultLabel(log.action);
  const actionLabel = formatActionLabel(log.action);
  const entityLabel = formatEntityLabel(log.tableName);
  const beforeSummary = summarizeAuditData(log.oldData);
  const afterSummary = summarizeAuditData(log.newData);

  return (
    <Card
      variant="outlined"
      data-testid={`audit-log-${log.id}`}
      sx={{
        height: "100%",
        borderColor: getSeverityBorderColor(severity.color),
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)"
      }}
    >
      <CardActionArea component="div" disableRipple sx={{ height: "100%", cursor: "default" }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="stretch">
            <Box
              aria-hidden
              sx={{
                display: { xs: "none", sm: "flex" },
                flexDirection: "column",
                alignItems: "center",
                pt: 0.5
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  bgcolor: getSeverityMainColor(severity.color),
                  boxShadow: 2
                }}
              />
              <Box sx={{ width: 2, flex: 1, bgcolor: getSeverityBorderColor(severity.color), mt: 1 }} />
            </Box>

            <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                    {actionLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(log.createdAt)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`Severidad ${severity.label}`} color={severity.color} />
                  <Chip size="small" label={result.label} color={result.color} variant="outlined" />
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip size="small" label={log.action} color="default" variant="outlined" />
                <Chip size="small" label={entityLabel} color="primary" variant="outlined" />
              </Stack>

              <Box
                sx={{
                  border: 1,
                  borderColor: getSeverityBorderColor(severity.color),
                  borderRadius: 2,
                  p: 1,
                  bgcolor: "background.default"
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Criterio de prioridad
                </Typography>
                <Typography variant="body2">{severity.helper}</Typography>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, height: "100%" }}>
                    <Typography variant="caption" color="text.secondary">
                      Actor
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
                        {log.user?.name ?? "Sistema"}
                      </Typography>

                      <Chip
                        size="small"
                        label={formatRole(log.user?.role)}
                        color={log.user?.role === "ADMIN" ? "primary" : "success"}
                        variant="outlined"
                      />
                    </Stack>

                    {log.user?.email && (
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                        {log.user.email}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, height: "100%" }}>
                    <Typography variant="caption" color="text.secondary">
                      Entidad afectada
                    </Typography>
                    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                      {entityLabel} · {log.recordId || "sin registro específico"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      IP: {log.ipAddress || "No disponible"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <Box
                    data-testid={`audit-before-${log.id}`}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1.25,
                      bgcolor: "background.default"
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Antes
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ m: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "monospace" }}
                    >
                      {beforeSummary}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    data-testid={`audit-after-${log.id}`}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1.25,
                      bgcolor: "background.default"
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Después
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ m: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "monospace" }}
                    >
                      {afterSummary}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
