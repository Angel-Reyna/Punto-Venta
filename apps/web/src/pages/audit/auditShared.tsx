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

export type AuditFilters = {
  q: string;
  action: string;
  tableName: string;
  dateFrom: string;
  dateTo: string;
};

export const initialFilters: AuditFilters = {
  q: "",
  action: "",
  tableName: "",
  dateFrom: "",
  dateTo: ""
};

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

function getActionColor(action: string): "default" | "primary" | "success" | "warning" | "error" {
  const normalized = action.toLowerCase();

  if (
    normalized.includes("delete") ||
    normalized.includes("cancel") ||
    normalized.includes("deactivate") ||
    normalized.includes("reset")
  ) {
    return "error";
  }

  if (
    normalized.includes("create") ||
    normalized.includes("open") ||
    normalized.includes("login")
  ) {
    return "success";
  }

  if (
    normalized.includes("update") ||
    normalized.includes("close") ||
    normalized.includes("return")
  ) {
    return "warning";
  }

  return "primary";
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
  helper
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

export function AuditLogCard({ log }: { log: AuditLog }) {
  return (
    <Card variant="outlined" data-testid={`audit-log-${log.id}`} sx={{ height: "100%" }}>
      <CardActionArea component="div" disableRipple sx={{ height: "100%", cursor: "default" }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={log.action}
                  color={getActionColor(log.action)}
                  variant="outlined"
                />
                <Chip size="small" label={log.tableName} />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {formatDate(log.createdAt)}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Usuario
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
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

            <Divider />

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Registro
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.recordId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Dirección IP
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
