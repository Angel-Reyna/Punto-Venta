import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

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
  const normalized = search.trim().toLowerCase();

  if (!normalized) return true;

  return [
    log.seller.name,
    log.seller.email,
    actionLabels[log.action],
    log.action,
    log.entityType,
    log.entityId,
    log.description,
    log.ipAddress,
    log.userAgent,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
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

export function ActivityMetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
          {value}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function SellerActivityCard({ log }: { log: SellerActivityLog }) {
  return (
    <Card variant="outlined" data-testid={`seller-activity-log-${log.id}`} sx={{ height: "100%" }}>
      <CardActionArea
        component="div"
        disableRipple
        sx={{ height: "100%", cursor: "default" }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  size="small"
                  label={actionLabels[log.action]}
                  color={getActionColor(log.action)}
                  variant="outlined"
                />
                <Chip size="small" label={log.entityType} />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {formatDate(log.createdAt)}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Vendedor
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Typography fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                  {log.seller.name}
                </Typography>
                <Chip
                  size="small"
                  label={log.seller.isActive ? "Activo" : "Inactivo"}
                  color={log.seller.isActive ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ overflowWrap: "anywhere" }}
              >
                {log.seller.email}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              {log.description}
            </Typography>

            <Divider />

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Entidad
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.entityId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  IP
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Dispositivo / navegador
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.userAgent || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function SummaryCard({ item }: { item: SummaryItem }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Chip
          size="small"
          label={actionLabels[item.action]}
          color={getActionColor(item.action)}
          variant="outlined"
        />

        <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
          {item.count}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Eventos registrados
        </Typography>
      </CardContent>
    </Card>
  );
}

export function EmptyActivityMessage() {
  return (
    <Card>
      <CardContent>
        <Typography fontWeight={800}>
          No hay actividad con los filtros actuales.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ajusta el rango, vendedor, acción o texto de búsqueda.
        </Typography>
      </CardContent>
    </Card>
  );
}

export function EmptySummaryMessage() {
  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary">
          No hay movimientos agrupados en este rango.
        </Typography>
      </CardContent>
    </Card>
  );
}
