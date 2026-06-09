import type { ReactNode } from "react";

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

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
export type AuditModule = "" | "catalog" | "inventory" | "sales" | "users" | "security" | "system";
export type AuditLayoutVariant = "mobile" | "tablet" | "desktop";
export type AuditView = "activity" | "events";

export type AuditFilters = {
  q: string;
  module: AuditModule;
  action: string;
  tableName: string;
  severity: AuditSeverity;
  userId: string;
  dateFrom: string;
  dateTo: string;
};

export const initialFilters: AuditFilters = {
  q: "",
  module: "",
  action: "",
  tableName: "",
  severity: "",
  userId: "",
  dateFrom: "",
  dateTo: "",
};

const SENSITIVE_KEY_PATTERN = /(password|token|secret|hash|pepper|credential|cookie|authorization)/i;

export const AUDIT_MODULE_OPTIONS: Array<{
  value: Exclude<AuditModule, "">;
  label: string;
  helper: string;
}> = [
  { value: "catalog", label: "Catálogo", helper: "Productos, precios e importaciones" },
  { value: "inventory", label: "Inventario", helper: "Existencias, almacenes y movimientos" },
  { value: "sales", label: "Ventas", helper: "Ventas, cancelaciones y devoluciones" },
  { value: "users", label: "Usuarios", helper: "Accesos, roles y contraseñas" },
  { value: "security", label: "Seguridad", helper: "Bloqueos, permisos y sesiones" },
  { value: "system", label: "Sistema", helper: "Procesos automáticos o tareas internas" },
];

const TABLE_MODULES: Record<string, Exclude<AuditModule, "">> = {
  InventoryMovement: "inventory",
  InventoryStock: "inventory",
  SellerStock: "inventory",
  StockTransferRequest: "inventory",
  Warehouse: "inventory",
  Product: "catalog",
  ProductImport: "catalog",
  Sale: "sales",
  SaleReturn: "sales",
  SaleAdjustmentRequest: "sales",
  Payment: "sales",
  User: "users",
  RefreshSession: "security",
  Permission: "security",
  AuthSession: "security",
  AuditLog: "system",
};


const currencyFormatter = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  maximumFractionDigits: 2,
  style: "currency",
});

const ACTION_LABELS: Record<string, string> = {
  INVENTORY_IN: "Entrada de inventario",
  CREATE_INVENTORY_IN: "Entrada de inventario",
  INVENTORY_OUT: "Salida de inventario",
  CREATE_INVENTORY_OUT: "Salida de inventario",
  INVENTORY_WAREHOUSE_CREATE: "Almacén creado",
  PRODUCT_CREATE: "Producto creado",
  CREATE_PRODUCT: "Producto creado",
  PRODUCT_DELETE: "Producto eliminado",
  DELETE_PRODUCT: "Producto eliminado",
  PRODUCT_IMPORT: "Productos importados desde Excel",
  IMPORT_PRODUCTS_EXCEL: "Productos importados desde Excel",
  PRODUCT_TOGGLE_ACTIVE: "Cambio de estado de producto",
  TOGGLE_PRODUCT_ACTIVE: "Cambio de estado de producto",
  PRODUCT_UPDATE: "Producto actualizado",
  UPDATE_PRODUCT: "Producto actualizado",
  SALE_CANCEL: "Venta cancelada",
  CANCEL_SALE: "Venta cancelada",
  SALE_CREATE: "Venta registrada",
  CREATE_SALE: "Venta registrada",
  SALE_RETURN: "Devolución registrada",
  CREATE_SALE_RETURN: "Devolución registrada",
  USER_ACTIVATE: "Usuario activado",
  ACTIVATE_USER: "Usuario activado",
  USER_CREATE: "Usuario creado",
  CREATE_USER: "Usuario creado",
  USER_DEACTIVATE: "Usuario desactivado",
  DEACTIVATE_USER: "Usuario desactivado",
  USER_PASSWORD_RESET: "Contraseña restablecida",
  RESET_PASSWORD: "Contraseña restablecida",
  USER_ROLE_UPDATE: "Rol actualizado",
  UPDATE_USER_ROLE: "Rol actualizado",
};

const ACTION_HELPERS: Record<string, string> = {
  INVENTORY_IN: "Entraron unidades al inventario.",
  CREATE_INVENTORY_IN: "Entraron unidades al inventario.",
  INVENTORY_OUT: "Salieron unidades del inventario.",
  CREATE_INVENTORY_OUT: "Salieron unidades del inventario.",
  INVENTORY_WAREHOUSE_CREATE: "Se agregó un almacén para organizar existencias.",
  PRODUCT_CREATE: "Se registró un producto nuevo en el catálogo.",
  CREATE_PRODUCT: "Se registró un producto nuevo en el catálogo.",
  PRODUCT_DELETE: "Se eliminó físicamente un producto permitido por las reglas del sistema.",
  DELETE_PRODUCT: "Se eliminó físicamente un producto permitido por las reglas del sistema.",
  PRODUCT_IMPORT: "Se cargaron productos desde un archivo Excel.",
  IMPORT_PRODUCTS_EXCEL: "Se cargaron productos desde un archivo Excel.",
  PRODUCT_TOGGLE_ACTIVE: "Se activó o desactivó un producto para venta.",
  TOGGLE_PRODUCT_ACTIVE: "Se activó o desactivó un producto para venta.",
  PRODUCT_UPDATE: "Se cambió información de un producto.",
  UPDATE_PRODUCT: "Se cambió información de un producto.",
  SALE_CANCEL: "Se canceló una venta existente.",
  CANCEL_SALE: "Se canceló una venta existente.",
  SALE_CREATE: "Se registró una venta, se guardó el pago y se actualizó el inventario.",
  CREATE_SALE: "Se registró una venta, se guardó el pago y se actualizó el inventario.",
  SALE_RETURN: "Se registró una devolución de producto.",
  CREATE_SALE_RETURN: "Se registró una devolución de producto.",
  USER_ACTIVATE: "Se permitió de nuevo el acceso de un usuario.",
  ACTIVATE_USER: "Se permitió de nuevo el acceso de un usuario.",
  USER_CREATE: "Se creó una cuenta de usuario.",
  CREATE_USER: "Se creó una cuenta de usuario.",
  USER_DEACTIVATE: "Se bloqueó el acceso de un usuario.",
  DEACTIVATE_USER: "Se bloqueó el acceso de un usuario.",
  USER_PASSWORD_RESET: "Se cambió la contraseña de un usuario.",
  RESET_PASSWORD: "Se cambió la contraseña de un usuario.",
  USER_ROLE_UPDATE: "Se cambió el rol de un usuario.",
  UPDATE_USER_ROLE: "Se cambió el rol de un usuario.",
};

const ACTION_MEANINGS: Record<string, string> = {
  INVENTORY_IN: "Aumentaron las existencias de uno o más productos.",
  CREATE_INVENTORY_IN: "Aumentaron las existencias de uno o más productos.",
  INVENTORY_OUT: "Disminuyeron las existencias por una salida manual.",
  CREATE_INVENTORY_OUT: "Disminuyeron las existencias por una salida manual.",
  INVENTORY_WAREHOUSE_CREATE: "El inventario puede separarse por una nueva ubicación.",
  PRODUCT_CREATE: "El producto ya puede aparecer en catálogo e inventario si está activo.",
  CREATE_PRODUCT: "El producto ya puede aparecer en catálogo e inventario si está activo.",
  PRODUCT_DELETE: "El producto dejó de estar disponible. El historial previo se conserva con snapshots.",
  DELETE_PRODUCT: "El producto dejó de estar disponible. El historial previo se conserva con snapshots.",
  PRODUCT_IMPORT: "El catálogo se modificó a partir de una plantilla Excel.",
  IMPORT_PRODUCTS_EXCEL: "El catálogo se modificó a partir de una plantilla Excel.",
  PRODUCT_TOGGLE_ACTIVE: "El producto cambió su disponibilidad para venderse.",
  TOGGLE_PRODUCT_ACTIVE: "El producto cambió su disponibilidad para venderse.",
  PRODUCT_UPDATE: "Cambió información que puede afectar búsqueda, precio, costo, promoción o stock mínimo.",
  UPDATE_PRODUCT: "Cambió información que puede afectar búsqueda, precio, costo, promoción o stock mínimo.",
  SALE_CANCEL: "La venta ya no debe contarse como operación completada.",
  CANCEL_SALE: "La venta ya no debe contarse como operación completada.",
  SALE_CREATE: "Se vendió producto, se registró el pago y bajó el inventario.",
  CREATE_SALE: "Se vendió producto, se registró el pago y bajó el inventario.",
  SALE_RETURN: "Se devolvió producto y la operación debe reflejarse en inventario y reportes.",
  CREATE_SALE_RETURN: "Se devolvió producto y la operación debe reflejarse en inventario y reportes.",
  USER_ACTIVATE: "La persona puede volver a entrar al sistema.",
  ACTIVATE_USER: "La persona puede volver a entrar al sistema.",
  USER_CREATE: "Hay una cuenta nueva que puede operar según su rol y permisos.",
  CREATE_USER: "Hay una cuenta nueva que puede operar según su rol y permisos.",
  USER_DEACTIVATE: "La persona ya no debería poder entrar al sistema.",
  DEACTIVATE_USER: "La persona ya no debería poder entrar al sistema.",
  USER_PASSWORD_RESET: "La persona necesitará usar la nueva contraseña para entrar.",
  RESET_PASSWORD: "La persona necesitará usar la nueva contraseña para entrar.",
  USER_ROLE_UPDATE: "La persona puede haber ganado o perdido permisos dentro de la aplicación.",
  UPDATE_USER_ROLE: "La persona puede haber ganado o perdido permisos dentro de la aplicación.",
};

const ACTION_REVIEW_HINTS: Record<string, string> = {
  INVENTORY_IN: "Revisa si las unidades agregadas no coinciden con la mercancía recibida.",
  CREATE_INVENTORY_IN: "Revisa si las unidades agregadas no coinciden con la mercancía recibida.",
  INVENTORY_OUT: "Revisa si no reconoces la salida o si el stock quedó incorrecto.",
  CREATE_INVENTORY_OUT: "Revisa si no reconoces la salida o si el stock quedó incorrecto.",
  INVENTORY_WAREHOUSE_CREATE: "Revisa que el nombre del almacén coincida con la ubicación real.",
  PRODUCT_CREATE: "Revisa precio, costo, SKU y stock inicial antes de venderlo.",
  CREATE_PRODUCT: "Revisa precio, costo, SKU y stock inicial antes de venderlo.",
  PRODUCT_DELETE: "Revisa si el producto no debía eliminarse o si todavía debería venderse.",
  DELETE_PRODUCT: "Revisa si el producto no debía eliminarse o si todavía debería venderse.",
  PRODUCT_IMPORT: "Revisa si después del Excel hay precios, nombres o existencias incorrectas.",
  IMPORT_PRODUCTS_EXCEL: "Revisa si después del Excel hay precios, nombres o existencias incorrectas.",
  PRODUCT_TOGGLE_ACTIVE: "Revisa si el producto desapareció o apareció por error en venta.",
  TOGGLE_PRODUCT_ACTIVE: "Revisa si el producto desapareció o apareció por error en venta.",
  PRODUCT_UPDATE: "Revisa si cambió precio, costo, promoción o datos de identificación.",
  UPDATE_PRODUCT: "Revisa si cambió precio, costo, promoción o datos de identificación.",
  SALE_CANCEL: "Revisa si la cancelación no fue autorizada o si afecta reportes.",
  CANCEL_SALE: "Revisa si la cancelación no fue autorizada o si afecta reportes.",
  SALE_CREATE: "Revisa si no reconoces la venta, el total o el vendedor.",
  CREATE_SALE: "Revisa si no reconoces la venta, el total o el vendedor.",
  SALE_RETURN: "Revisa si la devolución no corresponde con la venta original.",
  CREATE_SALE_RETURN: "Revisa si la devolución no corresponde con la venta original.",
  USER_ACTIVATE: "Revisa si la persona no debería tener acceso.",
  ACTIVATE_USER: "Revisa si la persona no debería tener acceso.",
  USER_CREATE: "Revisa rol, correo y estado de la cuenta.",
  CREATE_USER: "Revisa rol, correo y estado de la cuenta.",
  USER_DEACTIVATE: "Revisa si la persona sí debería conservar acceso.",
  DEACTIVATE_USER: "Revisa si la persona sí debería conservar acceso.",
  USER_PASSWORD_RESET: "Revisa si el cambio fue solicitado por la persona correcta.",
  RESET_PASSWORD: "Revisa si el cambio fue solicitado por la persona correcta.",
  USER_ROLE_UPDATE: "Revisa si el nuevo rol corresponde a sus responsabilidades.",
  UPDATE_USER_ROLE: "Revisa si el nuevo rol corresponde a sus responsabilidades.",
};

const ENTITY_LABELS: Record<string, string> = {
  InventoryMovement: "Movimiento de inventario",
  InventoryStock: "Existencia de inventario",
  SellerStock: "Stock físico de vendedor",
  StockTransferRequest: "Solicitud de retiro",
  Warehouse: "Almacén",
  Product: "Producto",
  ProductImport: "Importación de productos",
  Sale: "Venta",
  SaleReturn: "Devolución",
  SaleAdjustmentRequest: "Solicitud de ajuste de venta",
  Payment: "Pago",
  User: "Usuario",
  RefreshSession: "Sesión",
  Permission: "Permiso",
  AuthSession: "Sesión",
  AuditLog: "Auditoría",
};

const ENTITY_HELPERS: Record<string, string> = {
  InventoryMovement: "afectó existencias de inventario",
  InventoryStock: "afectó existencias de inventario",
  SellerStock: "afectó stock físico de vendedor",
  StockTransferRequest: "afectó una solicitud de retiro",
  Warehouse: "afectó un almacén",
  Product: "afectó el catálogo de productos",
  ProductImport: "afectó una importación de productos",
  Sale: "afectó una venta",
  SaleReturn: "afectó una devolución",
  SaleAdjustmentRequest: "afectó una solicitud de ajuste de venta",
  Payment: "afectó un pago",
  User: "afectó una cuenta de usuario",
  RefreshSession: "afectó una sesión",
  Permission: "afectó permisos",
  AuthSession: "afectó una sesión",
  AuditLog: "afectó el historial de auditoría",
};

const FACT_LABELS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Folio", pattern: /^(folio|saleFolio|saleNumber|number)$/i },
  { label: "Total", pattern: /^(total|totalAmount|grandTotal|amountPaid|paidAmount|amount)$/i },
  { label: "Cambio", pattern: /^(change|changeAmount)$/i },
  { label: "Forma de pago", pattern: /^(paymentMethod|method|paymentType)$/i },
  { label: "Producto", pattern: /^(productName|name|displayName)$/i },
  { label: "SKU", pattern: /^(sku|productSku)$/i },
  { label: "Código", pattern: /^(barcode|code)$/i },
  { label: "Cantidad", pattern: /^(quantity|qty|units|stock|initialStock)$/i },
  { label: "Precio", pattern: /^(salePrice|price|unitPrice|unitPriceAtSale)$/i },
  { label: "Costo", pattern: /^(costPrice|unitCost|unitCostAtSale)$/i },
  { label: "Correo", pattern: /^(email)$/i },
  { label: "Rol", pattern: /^(role)$/i },
  { label: "Estado", pattern: /^(isActive|active|status)$/i },
  { label: "Registros", pattern: /^(processed|processedRows|created|updated|skipped|imported)$/i },
];

function normalizeAction(value: string) {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

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
  const normalized = normalizeAction(action);
  return ACTION_LABELS[normalized] ?? titleCase(action);
}

export function formatActionHelper(action: string) {
  const normalized = normalizeAction(action);
  return ACTION_HELPERS[normalized] ?? "Se registró una acción del sistema.";
}

export function formatEntityLabel(tableName: string) {
  return ENTITY_LABELS[tableName] ?? titleCase(tableName);
}

export function formatAuditModuleLabel(module: AuditModule) {
  if (!module) return "Todos los módulos";
  return AUDIT_MODULE_OPTIONS.find((option) => option.value === module)?.label ?? titleCase(module);
}

export function getAuditModule(log: Pick<AuditLog, "action" | "tableName" | "user">): Exclude<AuditModule, ""> {
  const normalizedAction = normalizeAction(log.action);

  if (TABLE_MODULES[log.tableName]) return TABLE_MODULES[log.tableName];
  if (/LOGIN|LOGOUT|TOKEN|SESSION|PERMISSION|ACCESS|PASSWORD|DENIED|BLOCKED|AUTH/.test(normalizedAction)) {
    return "security";
  }
  if (/SALE|RETURN|REFUND|CANCEL/.test(normalizedAction)) return "sales";
  if (/INVENTORY|STOCK|WAREHOUSE|TRANSFER/.test(normalizedAction)) return "inventory";
  if (/PRODUCT|PRICE|IMPORT|CATALOG/.test(normalizedAction)) return "catalog";
  if (/USER|ROLE|PASSWORD/.test(normalizedAction)) return "users";

  return "system";
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
  const normalized = `${normalizeAction(log.action)} ${log.tableName}`.toLowerCase();

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
    normalized.includes("inventory_out") ||
    normalized.includes("return")
  ) {
    return {
      level: "high",
      label: "Alta",
      helper: "Cambio importante: puede afectar permisos, inventario o devoluciones.",
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

export function filterAuditLogsBySeverity(logs: AuditLog[], severity: AuditSeverity) {
  if (!severity) return logs;
  return logs.filter((log) => getAuditSeverity(log).level === severity);
}

export function filterAuditLogsByModule(logs: AuditLog[], module: AuditModule) {
  if (!module) return logs;
  return logs.filter((log) => getAuditModule(log) === module);
}

export function filterAuditLogsByUser(logs: AuditLog[], userId: string) {
  if (!userId) return logs;
  if (userId === "system") return logs.filter((log) => !log.user?.id);
  return logs.filter((log) => log.user?.id === userId);
}

export function getAuditUserFilterLabel(log: AuditLog) {
  if (!log.user) return "Sistema";
  return `${log.user.name} · ${formatRole(log.user.role)}`;
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

  if (filters.userId.trim()) {
    params.set("userId", filters.userId.trim());
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

function getSeverityMainColor(color: ChipColor) {
  if (color === "default") return "text.secondary";
  return `${color}.main`;
}

function summarizePrimitive(value: unknown) {
  if (value == null) return value;
  if (typeof value === "object") return Array.isArray(value) ? `[${value.length} elemento(s)]` : "{...}";
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getReadableActionDetails(log: AuditLog) {
  const normalized = normalizeAction(log.action);

  return {
    meaning: ACTION_MEANINGS[normalized] ?? "El sistema guardó esta acción para que pueda revisarse después.",
    reviewHint:
      ACTION_REVIEW_HINTS[normalized] ?? "Revisa este evento si no reconoces la acción o el responsable.",
    title: formatActionLabel(log.action),
  };
}

function getFieldLabel(key: string) {
  const cleanKey = key.split(".").pop() ?? key;
  const match = FACT_LABELS.find((entry) => entry.pattern.test(cleanKey));
  return match?.label;
}

function isMoneyKey(key: string) {
  return /(amount|total|price|cost|paid|change)$/i.test(key);
}

function formatFactValue(key: string, value: unknown) {
  if (value == null || value === "") return "Sin dato";

  if (typeof value === "boolean") {
    if (/active|isActive/i.test(key)) return value ? "Activo" : "Inactivo";
    return value ? "Sí" : "No";
  }

  if (typeof value === "number") {
    return isMoneyKey(key) ? currencyFormatter.format(value) : String(value);
  }

  if (typeof value === "string") {
    if (value === "ADMIN" || value === "CASHIER") return formatRole(value);
    return value;
  }

  return String(summarizePrimitive(value));
}

function collectFactCandidates(value: unknown, prefix = ""): Array<{ key: string; value: unknown }> {
  if (!isRecord(value)) return [];

  const facts: Array<{ key: string; value: unknown }> = [];

  for (const [key, rawValue] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key) || rawValue == null) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isRecord(rawValue)) {
      facts.push(...collectFactCandidates(rawValue, fullKey));
      continue;
    }

    if (Array.isArray(rawValue)) {
      if (/items|products|rows|details/i.test(key)) {
        facts.push({ key, value: `${rawValue.length} elemento(s)` });
      }
      continue;
    }

    facts.push({ key: fullKey, value: rawValue });
  }

  return facts;
}

function extractImportantFacts(log: AuditLog) {
  const sourceCandidates = [...collectFactCandidates(log.newData), ...collectFactCandidates(log.oldData)];
  const seen = new Set<string>();
  const facts: Array<{ label: string; value: string }> = [];

  for (const candidate of sourceCandidates) {
    const label = getFieldLabel(candidate.key);
    if (!label || seen.has(label)) continue;

    facts.push({ label, value: formatFactValue(candidate.key, candidate.value) });
    seen.add(label);

    if (facts.length >= 5) break;
  }

  return facts;
}

function buildPlainSummary(log: AuditLog) {
  const actor = log.user?.name ?? "El sistema";
  const { title } = getReadableActionDetails(log);
  const helper = formatActionHelper(log.action);
  return `${actor}: ${title.toLowerCase()}. ${helper}`;
}

function AuditFactChip({ label, value }: { label: string; value: string }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={`${label}: ${value}`}
      sx={{
        maxWidth: "100%",
        "& .MuiChip-label": {
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }}
    />
  );
}

function AuditStatusChips({
  result,
  severity,
}: {
  result: ReturnType<typeof getResultLabel>;
  severity: ReturnType<typeof getAuditSeverity>;
}) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      <Chip size="small" label={severity.label} color={severity.color} />
      <Chip size="small" label={result.label} color={result.color} variant="outlined" />
    </Stack>
  );
}

function ImportantFacts({ facts }: { facts: Array<{ label: string; value: string }> }) {
  if (facts.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {facts.slice(0, 3).map((fact) => (
        <AuditFactChip key={`${fact.label}-${fact.value}`} label={fact.label} value={fact.value} />
      ))}
    </Stack>
  );
}

function ClampedText({ children, lines = 2 }: { children: ReactNode; lines?: number }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        display: "-webkit-box",
        overflow: "hidden",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </Typography>
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
  const moduleLabel = formatAuditModuleLabel(getAuditModule(log));
  const actor = log.user?.name ?? "Sistema";
  const actorHelper = formatRole(log.user?.role);
  const facts = extractImportantFacts(log);
  const details = getReadableActionDetails(log);
  const summary = buildPlainSummary(log);

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
        <Box sx={{ height: 5, bgcolor: getSeverityMainColor(severity.color) }} />
        <CardContent sx={{ p: 1.15 }}>
          <Stack spacing={0.85}>
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  #{index} · {formatDate(log.createdAt)}
                </Typography>
                <Typography variant="subtitle1" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {actionLabel}
                </Typography>
              </Box>
              <AuditStatusChips result={result} severity={severity} />
            </Stack>

            <ClampedText lines={1}>{summary}</ClampedText>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              Impacto: {details.meaning}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 0.75,
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              <AuditFactChip label="Responsable" value={actor} />
              <AuditFactChip label="Módulo" value={moduleLabel} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {actorHelper}
            </Typography>
            <ImportantFacts facts={facts} />
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
          boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 1.25 }}>
          <Stack spacing={0.85}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  #{index} · {formatDate(log.createdAt)}
                </Typography>
                <Typography variant="subtitle1" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {actionLabel}
                </Typography>
              </Box>
              <AuditStatusChips result={result} severity={severity} />
            </Stack>

            <ClampedText lines={1}>{summary}</ClampedText>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              Qué revisar: {details.reviewHint}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <AuditFactChip label="Responsable" value={actor} />
              <AuditFactChip label="Módulo" value={moduleLabel} />
              <AuditFactChip label="Rol" value={actorHelper} />
            </Stack>
            <ImportantFacts facts={facts} />
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
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { md: "104px minmax(0, 1fr) minmax(150px, 0.32fr)" },
            minHeight: 104,
          }}
        >
          <Box
            sx={{
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              p: 1.25,
            }}
          >
            <Stack spacing={0.75} alignItems="flex-start">
              <Typography variant="caption" color="text.secondary" fontWeight={900}>
                Evento #{index}
              </Typography>
              <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {formatDate(log.createdAt)}
              </Typography>
              <Chip size="small" label={severity.label} color={severity.color} />
            </Stack>
          </Box>

          <Stack spacing={1} sx={{ p: 1.5, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {actionLabel}
                </Typography>
                <ClampedText lines={1}>{summary}</ClampedText>
                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: "block", mt: 0.35 }}>
                  Qué significa: {details.meaning}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: "block", mt: 0.2 }}>
                  Qué revisar: {details.reviewHint}
                </Typography>
              </Box>
              <Chip size="small" label={result.label} color={result.color} variant="outlined" sx={{ flexShrink: 0 }} />
            </Stack>
            <ImportantFacts facts={facts} />
          </Stack>

          <Box
            sx={{
              borderLeft: 1,
              borderColor: "divider",
              p: 1.5,
              bgcolor: "background.default",
              minWidth: 0,
            }}
          >
            <Stack spacing={0.75}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Responsable
                </Typography>
                <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                  {actor}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>
                  {actorHelper}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Módulo
                </Typography>
                <Typography variant="body2" fontWeight={900}>
                  {moduleLabel}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
