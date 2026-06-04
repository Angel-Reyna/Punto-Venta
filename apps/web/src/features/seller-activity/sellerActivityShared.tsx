import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { valuesIncludeSearchText } from "../../utils/text";

export type SellerAction =
  | "SELLER_LOGIN"
  | "SELLER_LOGOUT"
  | "SALE_CREATED"
  | "SALE_VIEWED"
  | "PRODUCT_VIEWED"
  | "FAILED_ACCESS_ATTEMPT";

export type Seller = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  isActive: boolean;
};

export type SellerActivityLog = {
  id: string;
  sellerId: string;
  action: SellerAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  seller: Seller;
};

export type SummaryItem = {
  action: SellerAction;
  count: number;
};

export type SellerActivityBySeller = {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  isActive: boolean;
  total: number;
  saleCreatedCount: number;
  failedAccessCount: number;
  lastActivityAt: string | null;
};

export const SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS = 30_000;

export const DEFAULT_SELLER_ACTIVITY_LIMIT = 200;

export type SellerActivityFilters = {
  sellerId: string;
  action: string;
  from: string;
  to: string;
  limit: number;
};

export function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getRelativeDateInputValue(daysBack: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysBack);

  return toDateInputValue(value);
}

export function getActionLabel(value: string) {
  if (!value) return "Todas las acciones";

  return sellerActions.includes(value as SellerAction) ? actionLabels[value as SellerAction] : value;
}

export function getDateRangeLabel(from: string, to: string) {
  if (!from || !to) return "Periodo inválido";
  if (from === to) return from;

  return `${from} → ${to}`;
}

export function formatRelativeLastUpdated(value: Date | null, now = new Date()) {
  if (!value) return "Sin actualización todavía";

  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - value.getTime()) / 1000),
  );

  if (diffSeconds < 5) return "Actualizado hace unos segundos";
  if (diffSeconds < 60) return `Actualizado hace ${diffSeconds} segundos`;

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes === 1) return "Actualizado hace 1 minuto";
  if (diffMinutes < 60) return `Actualizado hace ${diffMinutes} minutos`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours === 1) return "Actualizado hace 1 hora";

  return `Actualizado hace ${diffHours} horas`;
}

export const sellerActions: SellerAction[] = [
  "SELLER_LOGIN",
  "SELLER_LOGOUT",
  "SALE_CREATED",
  "SALE_VIEWED",
  "PRODUCT_VIEWED",
  "FAILED_ACCESS_ATTEMPT",
];

export const actionLabels: Record<SellerAction, string> = {
  SELLER_LOGIN: "Inicio de sesión",
  SELLER_LOGOUT: "Cierre de sesión",
  SALE_CREATED: "Venta registrada",
  SALE_VIEWED: "Venta consultada",
  PRODUCT_VIEWED: "Producto consultado",
  FAILED_ACCESS_ATTEMPT: "Acceso bloqueado",
};


export const actionBusinessMeaning: Record<SellerAction, string> = {
  SELLER_LOGIN: "El vendedor entró a la app y puede operar con sus permisos.",
  SELLER_LOGOUT: "El vendedor cerró su sesión o dejó de operar en la app.",
  SALE_CREATED: "Se registró una venta y el movimiento ya forma parte de la operación del día.",
  SALE_VIEWED: "El vendedor consultó una venta existente para revisar información.",
  PRODUCT_VIEWED: "El vendedor consultó producto o inventario disponible.",
  FAILED_ACCESS_ATTEMPT: "Alguien intentó abrir una sección sin permiso. Conviene revisar si fue esperado.",
};

export const actionReviewHint: Record<SellerAction, string> = {
  SELLER_LOGIN: "Revisa si el horario o dispositivo no coincide con la operación normal.",
  SELLER_LOGOUT: "Útil para confirmar cuándo terminó la actividad del vendedor.",
  SALE_CREATED: "Revisa el monto o folio si no reconoces la venta.",
  SALE_VIEWED: "Útil para saber qué ventas se consultaron durante la operación.",
  PRODUCT_VIEWED: "Útil para entender qué productos consultó el vendedor.",
  FAILED_ACCESS_ATTEMPT: "Revisa permisos, usuario e IP si el intento no era esperado.",
};

export function getEntityDisplayName(value: string) {
  const labels: Record<string, string> = {
    AuthSession: "Sesión",
    Permission: "Permiso",
    Product: "Producto",
    Sale: "Venta",
    User: "Usuario",
  };

  return labels[value] ?? value;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getActionColor(
  action: SellerAction,
): "primary" | "success" | "warning" | "error" {
  if (action === "SALE_CREATED") return "success";
  if (action === "FAILED_ACCESS_ATTEMPT") return "error";
  if (action === "SELLER_LOGOUT") return "warning";
  return "primary";
}

export function matchesSearch(log: SellerActivityLog, search: string) {
  return valuesIncludeSearchText(
    [
      log.seller.name,
      log.seller.email,
      actionLabels[log.action],
      log.action,
      log.entityType,
      log.entityId,
      log.description,
      log.ipAddress,
      log.userAgent,
    ],
    search
  );
}

export function summarizeActivityBySeller(rows: SellerActivityLog[]): SellerActivityBySeller[] {
  const sellers = new Map<string, SellerActivityBySeller>();

  for (const row of rows) {
    const current = sellers.get(row.sellerId) ?? {
      sellerId: row.sellerId,
      sellerName: row.seller.name,
      sellerEmail: row.seller.email,
      isActive: row.seller.isActive,
      total: 0,
      saleCreatedCount: 0,
      failedAccessCount: 0,
      lastActivityAt: null,
    };

    current.total += 1;
    current.saleCreatedCount += row.action === "SALE_CREATED" ? 1 : 0;
    current.failedAccessCount += row.action === "FAILED_ACCESS_ATTEMPT" ? 1 : 0;

    if (
      !current.lastActivityAt ||
      new Date(row.createdAt).getTime() > new Date(current.lastActivityAt).getTime()
    ) {
      current.lastActivityAt = row.createdAt;
    }

    sellers.set(row.sellerId, current);
  }

  return Array.from(sellers.values()).sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;

    return (
      new Date(right.lastActivityAt ?? 0).getTime() -
      new Date(left.lastActivityAt ?? 0).getTime()
    );
  });
}

export function buildQuery(args: {
  sellerId: string;
  action: string;
  from: string;
  to: string;
  limit: number;
}) {
  const params = new URLSearchParams();

  if (args.sellerId) {
    params.set("sellerId", args.sellerId);
  }

  if (args.action) {
    params.set("action", args.action);
  }

  if (args.from) {
    params.set("from", args.from);
  }

  if (args.to) {
    params.set("to", args.to);
  }

  params.set("limit", String(args.limit));

  return params.toString();
}

export function filtersAreInvalid(args: {
  from: string;
  to: string;
  limit: number;
}) {
  return (
    !args.from ||
    !args.to ||
    new Date(args.from) > new Date(args.to) ||
    args.limit < 1 ||
    args.limit > 500
  );
}

export function summarizeActivity(rows: SellerActivityLog[]) {
  return {
    failedAccessCount: rows.filter(
      (row) => row.action === "FAILED_ACCESS_ATTEMPT",
    ).length,
    saleCreatedCount: rows.filter((row) => row.action === "SALE_CREATED")
      .length,
    activeSellersInResults: new Set(rows.map((row) => row.seller.id)).size,
  };
}

export function SummaryCard({ item }: { item: SummaryItem }) {
  const tone = getActionColor(item.action);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.05),
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
          <Chip size="small" label={actionLabels[item.action]} color={tone} variant="outlined" />
          <Typography variant="h5" fontWeight={900}>
            {item.count}
          </Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Eventos registrados
        </Typography>
      </CardContent>
    </Card>
  );
}

export function EmptyActivityMessage() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography fontWeight={800}>No hay actividad con los filtros actuales.</Typography>
        <Typography variant="body2" color="text.secondary">
          Ajusta el rango, vendedor, acción o texto de búsqueda.
        </Typography>
      </CardContent>
    </Card>
  );
}

export function EmptySummaryMessage() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary">No hay movimientos agrupados en este rango.</Typography>
      </CardContent>
    </Card>
  );
}
