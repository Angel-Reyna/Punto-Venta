import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RouterOutlinedIcon from "@mui/icons-material/RouterOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  actionBusinessMeaning,
  actionLabels,
  actionReviewHint,
  EmptyActivityMessage,
  formatDate,
  getActionColor,
  getEntityDisplayName,
  type SellerAction,
  type SellerActivityLog,
} from "./sellerActivityShared";

function getActionIcon(action: SellerAction) {
  if (action === "SELLER_LOGIN") return <LoginIcon fontSize="small" />;
  if (action === "SELLER_LOGOUT") return <LogoutIcon fontSize="small" />;
  if (action === "SALE_CREATED") return <PointOfSaleIcon fontSize="small" />;
  if (action === "PRODUCT_VIEWED") return <Inventory2OutlinedIcon fontSize="small" />;
  if (action === "FAILED_ACCESS_ATTEMPT") return <BlockIcon fontSize="small" />;

  return <VisibilityIcon fontSize="small" />;
}

function TimelineActivityCard({ log, isLast }: { log: SellerActivityLog; isLast: boolean }) {
  const tone = getActionColor(log.action);

  return (
    <Box
      data-testid={`seller-activity-log-${log.id}`}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "42px 1fr" },
        columnGap: { sm: 2 },
      }}
    >
      <Stack alignItems="center" sx={{ display: { xs: "none", sm: "flex" }, pt: 1 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: `${tone}.main`,
            bgcolor: (theme) => alpha(theme.palette[tone].main, 0.13),
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette[tone].main, 0.32),
          }}
        >
          {getActionIcon(log.action)}
        </Box>

        {!isLast && <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: "divider", my: 0.75 }} />}
      </Stack>

      <Card
        variant="outlined"
        sx={{
          mb: isLast ? 0 : 2,
          borderLeft: "4px solid",
          borderLeftColor: `${tone}.main`,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.98),
          transition: "border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
          "&:hover": {
            boxShadow: 3,
            transform: { sm: "translateY(-1px)" },
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip size="small" label={actionLabels[log.action]} color={tone} variant="filled" />
                <Chip size="small" label={getEntityDisplayName(log.entityType)} variant="outlined" />
              </Stack>

              <Stack direction="row" spacing={0.75} alignItems="center">
                <AccessTimeIcon color="action" fontSize="small" />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {formatDate(log.createdAt)}
                </Typography>
              </Stack>
            </Stack>

            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <PersonOutlineIcon color="action" fontSize="small" />
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

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: "anywhere" }}>
                {log.seller.email}
              </Typography>
            </Box>

            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette[tone].main, 0.07),
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette[tone].main, 0.16),
              }}
            >
              <Typography fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {log.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, overflowWrap: "anywhere" }}>
                {actionBusinessMeaning[log.action]}
              </Typography>
            </Box>

            <Grid container spacing={1.5}>
              <Grid item xs={12} md={5}>
                <Typography variant="caption" color="text.secondary">
                  Revisar si
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {actionReviewHint[log.action]}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Referencia
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.entityId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <RouterOutlinedIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    IP / dispositivo
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                    overflowWrap: "anywhere",
                  }}
                >
                  {log.userAgent || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export function SellerActivityTimeline({
  rows,
  totalRows,
}: {
  rows: SellerActivityLog[];
  totalRows: number;
}) {
  return (
    <Stack spacing={2}>
      <Card variant="outlined" data-testid="seller-activity-results-heading">
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Línea de tiempo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {rows.length} de {totalRows} movimientos visibles con la búsqueda local actual. Los filtros de servidor se
                aplican al consultar.
              </Typography>
            </Box>
            <Chip size="small" color={rows.length === 0 ? "default" : "primary"} label={`${rows.length} eventos`} />
          </Stack>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyActivityMessage />
      ) : (
        <Stack spacing={0} data-testid="seller-activity-results-list">
          {rows.map((log, index) => (
            <TimelineActivityCard key={log.id} log={log} isLast={index === rows.length - 1} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
