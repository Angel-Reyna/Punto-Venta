import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
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
export type AuditLayoutVariant = "mobile" | "tablet" | "desktop";

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
  dateTo: "",
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
  USER_ROLE_UPDATE: "Rol actualizado",
};

const ACTION_HELPERS: Record<string, string> = {
  CASH_REGISTER_CLOSE: "Se cerró una caja y quedó guardado el corte.",
  CASH_REGISTER_MOVEMENT: "Se agregó o retiró efectivo manualmente de caja.",
  CASH_REGISTER_OPEN: "Se abrió una caja para control de efectivo.",
  INVENTORY_IN: "Entraron unidades al inventario.",
  INVENTORY_OUT: "Salieron unidades del inventario.",
  PRODUCT_CREATE: "Se registró un producto nuevo en el catálogo.",
  PRODUCT_DELETE: "Se eliminó físicamente un producto permitido por las reglas del sistema.",
  PRODUCT_IMPORT: "Se cargaron productos desde un archivo Excel.",
  PRODUCT_TOGGLE_ACTIVE: "Se activó o desactivó un producto para venta.",
  PRODUCT_UPDATE: "Se cambió información de un producto.",
  SALE_CANCEL: "Se canceló una venta existente.",
  SALE_CREATE: "Se registró una venta y se actualizó inventario.",
  SALE_RETURN: "Se registró una devolución de producto.",
  USER_ACTIVATE: "Se permitió de nuevo el acceso de un usuario.",
  USER_CREATE: "Se creó una cuenta de usuario.",
  USER_DEACTIVATE: "Se bloqueó el acceso de un usuario.",
  USER_PASSWORD_RESET: "Se cambió la contraseña de un usuario.",
  USER_ROLE_UPDATE: "Se cambió el rol de un usuario.",
};

const ENTITY_LABELS: Record<string, string> = {
  CashRegisterMovement: "Movimiento de caja",
  CashRegisterSession: "Caja",
  InventoryMovement: "Inventario",
  Product: "Producto",
  Sale: "Venta",
  SaleReturn: "Devolución",
  User: "Usuario",
};

const ENTITY_HELPERS: Record<string, string> = {
  CashRegisterMovement: "afectó el efectivo registrado en caja",
  CashRegisterSession: "afectó una caja abierta o cerrada",
  InventoryMovement: "afectó existencias de inventario",
  Product: "afectó el catálogo de productos",
  Sale: "afectó una venta",
  SaleReturn: "afectó una devolución",
  User: "afectó una cuenta de usuario",
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
    timeStyle: "short",
  });
}

export function formatRole(role?: "ADMIN" | "CASHIER") {
  if (role === "ADMIN") return "Administrador";
  if (role === "CASHIER") return "Vendedor";
  return "Sistema";
}

export function formatActionLabel(action: string) {
  return ACTION_LABELS[action] ?? titleCase(action);
}

export function formatActionHelper(action: string) {
  return ACTION_HELPERS[action] ?? "Se registró una acción del sistema.";
}

export function formatEntityLabel(tableName: string) {
  return ENTITY_LABELS[tableName] ?? titleCase(tableName);
}

export function formatEntityHelper(tableName: string) {
  return ENTITY_HELPERS[tableName] ?? "afectó un registro del sistema";
}

type ChipColor = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
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
      helper: "Revisar primero: puede afectar acceso, historial o datos importantes.",
      color: "error",
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
      helper: "Cambio importante: puede afectar permisos, caja, inventario o devoluciones.",
      color: "warning",
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
      helper: "Cambio operativo normal que conviene poder consultar después.",
      color: "info",
    };
  }

  return {
    level: "low",
    label: "Informativo",
    helper: "Evento de baja prioridad.",
    color: "success",
  };
}

function getResultLabel(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("fail") || normalized.includes("blocked") || normalized.includes("denied")) {
    return { label: "No se completó", color: "warning" as ChipColor };
  }

  return { label: "Completado", color: "success" as ChipColor };
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

function getSeverityBorderColor(color: ChipColor) {
  if (color === "default") return "divider";
  return `${color}.light`;
}

function getSeveritySoftColor(_color: ChipColor) {
  return "background.default";
}

function getSeverityMainColor(color: ChipColor) {
  if (color === "default") return "text.secondary";
  return `${color}.main`;
}

function buildPlainSummary(log: AuditLog) {
  const actor = log.user?.name ?? "El sistema";
  const action = formatActionLabel(log.action).toLowerCase();
  const entity = formatEntityHelper(log.tableName);
  return `${actor} ${action} y ${entity}.`;
}

function TechnicalDetails({ log, defaultExpanded }: { log: AuditLog; defaultExpanded: boolean }) {
  const beforeSummary = summarizeAuditData(log.oldData);
  const afterSummary = summarizeAuditData(log.newData);

  return (
    <Box
      component="details"
      {...(defaultExpanded ? { open: true } : {})}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        "& > summary": {
          cursor: "pointer",
          listStyle: "none",
          px: 1.25,
          py: 1,
        },
        "& > summary::-webkit-details-marker": { display: "none" },
      }}
    >
      <Box component="summary">
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={850}>Detalles del cambio</Typography>
            <Typography variant="caption" color="text.secondary">
              Datos seguros para revisión. Contraseñas, tokens y secretos se ocultan automáticamente.
            </Typography>
          </Box>
          <Typography aria-hidden color="text.secondary" sx={{ fontSize: 18 }}>
            ⌄
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 1.25, pb: 1.25 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Box
              data-testid={`audit-before-${log.id}`}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 1.25,
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Antes del cambio
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
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Después del cambio
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
      </Box>
    </Box>
  );
}

function AuditFact({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, minWidth: 0, height: "100%" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          {helper}
        </Typography>
      )}
    </Box>
  );
}

function AuditStatusChips({ result, severity }: { result: ReturnType<typeof getResultLabel>; severity: ReturnType<typeof getAuditSeverity> }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      <Chip size="small" label={`Severidad ${severity.label}`} color={severity.color} />
      <Chip size="small" label={result.label} color={result.color} variant="outlined" />
    </Stack>
  );
}

export function AuditLogCard({
  index = 1,
  log,
  variant = "desktop",
}: {
  index?: number;
  log: AuditLog;
  variant?: AuditLayoutVariant;
}) {
  const severity = getAuditSeverity(log);
  const result = getResultLabel(log.action);
  const actionLabel = formatActionLabel(log.action);
  const entityLabel = formatEntityLabel(log.tableName);
  const actor = log.user?.name ?? "Sistema";
  const actorHelper = log.user?.email ? `${formatRole(log.user.role)} · ${log.user.email}` : formatRole(log.user?.role);

  if (variant === "mobile") {
    return (
      <Card
        data-testid={`audit-log-${log.id}`}
        sx={{
          border: 1,
          borderColor: getSeverityBorderColor(severity.color),
          borderRadius: 3,
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Box sx={{ height: 6, bgcolor: getSeverityMainColor(severity.color) }} />
        <CardContent sx={{ p: 1.5 }}>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  bgcolor: getSeverityMainColor(severity.color),
                  color: "common.white",
                  fontWeight: 950,
                  flexShrink: 0,
                }}
              >
                {index}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {actionLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(log.createdAt)}
                </Typography>
              </Box>
            </Stack>

            <AuditStatusChips result={result} severity={severity} />

            <Box sx={{ borderRadius: 2, bgcolor: "background.default", p: 1.1 }}>
              <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {buildPlainSummary(log)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {severity.helper}
              </Typography>
            </Box>

            <Stack spacing={0.75}>
              <AuditFact label="Quién" value={actor} helper={actorHelper} />
              <Stack direction="row" spacing={0.75}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <AuditFact label="Área" value={entityLabel} helper={log.recordId || "Sin ID"} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <AuditFact label="IP" value={log.ipAddress || "No disponible"} helper="Origen" />
                </Box>
              </Stack>
            </Stack>

            <TechnicalDetails log={log} defaultExpanded={false} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (variant === "tablet") {
    return (
      <Card
        data-testid={`audit-log-${log.id}`}
        sx={{
          height: "100%",
          border: 1,
          borderColor: getSeverityBorderColor(severity.color),
          borderRadius: 3,
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 1.75 }}>
          <Stack spacing={1.25} sx={{ height: "100%" }}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Evento #{index} · {formatDate(log.createdAt)}
                </Typography>
                <Typography variant="subtitle1" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {actionLabel}
                </Typography>
              </Box>
              <AuditStatusChips result={result} severity={severity} />
            </Stack>

            <Box
              sx={{
                borderLeft: 5,
                borderColor: getSeverityMainColor(severity.color),
                borderRadius: 2,
                bgcolor: getSeveritySoftColor(severity.color),
                p: 1,
              }}
            >
              <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {buildPlainSummary(log)}
              </Typography>
            </Box>

            <Grid container spacing={1} sx={{ flex: 1 }}>
              <Grid item xs={12}>
                <AuditFact label="Responsable" value={actor} helper={actorHelper} />
              </Grid>
              <Grid item xs={6}>
                <AuditFact label="Área" value={entityLabel} helper={log.recordId || "Sin ID visible"} />
              </Grid>
              <Grid item xs={6}>
                <AuditFact label="Origen" value={log.ipAddress || "No disponible"} helper="IP" />
              </Grid>
            </Grid>

            <TechnicalDetails log={log} defaultExpanded={false} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-testid={`audit-log-${log.id}`}
      sx={{
        border: 1,
        borderColor: getSeverityBorderColor(severity.color),
        borderRadius: 3,
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "132px minmax(0, 1fr)", minHeight: 180 }}>
          <Box
            sx={{
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              p: 2,
            }}
          >
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  bgcolor: getSeverityMainColor(severity.color),
                  color: "common.white",
                  fontWeight: 950,
                }}
              >
                {index}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatDate(log.createdAt)}
              </Typography>
              <Chip size="small" label={`Severidad ${severity.label}`} color={severity.color} />
            </Stack>
          </Box>

          <Stack spacing={1.5} sx={{ p: 2, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {actionLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatActionHelper(log.action)} {severity.helper}
                </Typography>
              </Box>
              <Chip size="small" label={result.label} color={result.color} variant="outlined" />
            </Stack>

            <Box
              sx={{
                border: 1,
                borderColor: getSeverityBorderColor(severity.color),
                borderRadius: 2,
                p: 1.25,
                bgcolor: "background.default",
              }}
            >
              <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {buildPlainSummary(log)}
              </Typography>
            </Box>

            <Grid container spacing={1.25}>
              <Grid item xs={12} md={4}>
                <AuditFact label="Quién lo hizo" value={actor} helper={actorHelper} />
              </Grid>
              <Grid item xs={12} md={4}>
                <AuditFact label="Qué área afectó" value={entityLabel} helper={log.recordId || "Sin ID visible"} />
              </Grid>
              <Grid item xs={12} md={4}>
                <AuditFact label="Desde dónde" value={log.ipAddress || "No disponible"} helper="IP registrada por la API" />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`Código de acción: ${log.action}`} color="default" variant="outlined" />
              <Chip size="small" label={`Tabla: ${log.tableName}`} color="default" variant="outlined" />
            </Stack>

            <Divider />

            <TechnicalDetails log={log} defaultExpanded />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
