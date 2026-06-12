import { useEffect, useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import BlockIcon from "@mui/icons-material/Block";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RouterOutlinedIcon from "@mui/icons-material/RouterOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
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

function getSellerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";
}

function getActionSummary(action: SellerAction) {
  if (action === "SALE_CREATED") return "Movimiento comercial";
  if (action === "FAILED_ACCESS_ATTEMPT") return "Revisar permiso";
  if (action === "SELLER_LOGIN") return "Inicio de operación";
  if (action === "SELLER_LOGOUT") return "Fin de operación";
  if (action === "PRODUCT_VIEWED") return "Consulta de producto";

  return "Consulta operativa";
}

function TimelineActivityCard({ log }: { log: SellerActivityLog }) {
  const [showDetails, setShowDetails] = useState(false);
  const tone = getActionColor(log.action);
  const sellerStatusLabel = log.seller.isActive ? "Activo" : "Inactivo";

  return (
    <Card
      variant="outlined"
      data-testid={`seller-activity-log-${log.id}`}
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        borderColor: alpha(theme.palette[tone].main, 0.24),
        bgcolor: alpha(theme.palette.background.paper, 0.98),
        boxShadow: `0 16px 42px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.26 : 0.06)}`,
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: "0 auto 0 0",
          width: 7,
          bgcolor: `${tone}.main`,
        },
        "&:hover": {
          borderColor: `${tone}.main`,
          boxShadow: `0 22px 54px ${alpha(theme.palette[tone].main, 0.16)}`,
          transform: { sm: "translateY(-2px)" },
        },
      })}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, pl: { xs: 2.5, md: 3 } }}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={8}>
            <Stack spacing={1.5} height="100%">
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Avatar
                    sx={(theme) => ({
                      width: 54,
                      height: 54,
                      fontWeight: 950,
                      bgcolor: alpha(theme.palette[tone].main, 0.16),
                      color: `${tone}.main`,
                      border: "1px solid",
                      borderColor: alpha(theme.palette[tone].main, 0.28),
                    })}
                  >
                    {getSellerInitials(log.seller.name)}
                  </Avatar>
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      right: -4,
                      bottom: -4,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      color: theme.palette[tone].contrastText,
                      bgcolor: `${tone}.main`,
                      border: "2px solid",
                      borderColor: "background.paper",
                    })}
                  >
                    {getActionIcon(log.action)}
                  </Box>
                </Box>

                <Box minWidth={0} flex={1}>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
                    <Chip size="small" color={tone} label={actionLabels[log.action]} sx={{ fontWeight: 900 }} />
                    <Chip size="small" variant="outlined" label={getActionSummary(log.action)} />
                    <Chip size="small" variant="outlined" label={getEntityDisplayName(log.entityType)} />
                  </Stack>
                  <Typography variant="h6" fontWeight={950} sx={{ mt: 0.75, overflowWrap: "anywhere", lineHeight: 1.18 }}>
                    {log.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
                    {actionBusinessMeaning[log.action]}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={(theme) => ({
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.14 : 0.07),
                  border: "1px solid",
                  borderColor: alpha(theme.palette[tone].main, 0.18),
                })}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon color={tone} fontSize="small" sx={{ mt: 0.15 }} />
                  <Box minWidth={0}>
                    <Typography variant="caption" color="text.secondary" fontWeight={900} textTransform="uppercase">
                      Lectura sugerida
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                      {actionReviewHint[log.action]}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack
              spacing={1.25}
              sx={(theme) => ({
                height: "100%",
                p: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.24 : 0.55),
                border: "1px solid",
                borderColor: "divider",
              })}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonOutlineIcon color="action" fontSize="small" />
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Vendedor
                  </Typography>
                  <Typography fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                    {log.seller.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {log.seller.email}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonthOutlinedIcon color="action" fontSize="small" />
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Momento
                  </Typography>
                  <Typography variant="body2" fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
                    {formatDate(log.createdAt)}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                <Chip size="small" color={log.seller.isActive ? "success" : "default"} label={`Vendedor ${sellerStatusLabel.toLowerCase()}`} />
                <Chip size="small" variant="outlined" label={getEntityDisplayName(log.entityType)} />
              </Stack>

              <Box sx={{ mt: "auto" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowDetails((current) => !current)}
                  fullWidth
                  sx={{ borderRadius: 2, fontWeight: 900 }}
                >
                  {showDetails ? "Ocultar datos técnicos" : "Ver datos técnicos"}
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Collapse in={showDetails} timeout="auto" unmountOnExit>
          <Box
            sx={(theme) => ({
              mt: 2,
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.background.default, 0.72),
              border: "1px dashed",
              borderColor: "divider",
            })}
          >
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  Referencia operativa
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.entityId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <RouterOutlinedIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    IP o señal de acceso
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  Dispositivo / navegador
                </Typography>
                <Typography
                  variant="body2"
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
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

const SELLER_ACTIVITY_PAGE_SIZE = 5;

export function SellerActivityTimeline({
  rows,
  totalRows,
}: {
  rows: SellerActivityLog[];
  totalRows: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / SELLER_ACTIVITY_PAGE_SIZE));
  const saleEvents = rows.filter((row) => row.action === "SALE_CREATED").length;
  const blockedEvents = rows.filter((row) => row.action === "FAILED_ACCESS_ATTEMPT").length;
  const queryEvents = rows.filter((row) => row.action === "PRODUCT_VIEWED" || row.action === "SALE_VIEWED").length;
  const progressValue = rows.length > 0 ? (Math.min(page * SELLER_ACTIVITY_PAGE_SIZE, rows.length) / rows.length) * 100 : 0;

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * SELLER_ACTIVITY_PAGE_SIZE;
    return rows.slice(start, start + SELLER_ACTIVITY_PAGE_SIZE);
  }, [page, rows]);

  const pageStart = rows.length === 0 ? 0 : (page - 1) * SELLER_ACTIVITY_PAGE_SIZE + 1;
  const pageEnd = Math.min(rows.length, page * SELLER_ACTIVITY_PAGE_SIZE);

  return (
    <Stack spacing={2}>
      <Card
        variant="outlined"
        data-testid="seller-activity-results-heading"
        sx={(theme) => ({
          overflow: "hidden",
          borderColor: alpha(theme.palette.primary.main, 0.2),
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(
            theme.palette.background.paper,
            0.98,
          )} 48%, ${alpha(theme.palette.success.main, 0.08)})`,
        })}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={900}>
                  Bandeja operativa
                </Typography>
                <Typography variant="h5" fontWeight={950}>
                  Eventos recientes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 780 }}>
                  {rows.length} de {totalRows} eventos encontrados. Mostrando {pageStart}-{pageEnd}. Lee cada tarjeta como una acción concreta del vendedor.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="success" label={`${saleEvents} ventas`} />
                <Chip color={blockedEvents > 0 ? "error" : "default"} label={`${blockedEvents} bloqueos`} />
                <Chip color="primary" variant="outlined" label={`${queryEvents} consultas`} />
              </Stack>
            </Stack>

            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: (theme) => alpha(theme.palette.success.main, 0.08), height: "100%" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Qué pasó
                  </Typography>
                  <Typography variant="body2" fontWeight={850}>
                    Acción principal: venta, consulta, inicio de sesión o bloqueo.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: (theme) => alpha(theme.palette.info.main, 0.08), height: "100%" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Quién lo hizo
                  </Typography>
                  <Typography variant="body2" fontWeight={850}>
                    Vendedor, correo y estado activo aparecen juntos para ubicar al responsable.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1), height: "100%" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Qué revisar
                  </Typography>
                  <Typography variant="body2" fontWeight={850}>
                    Cada evento incluye una pista de revisión y oculta los datos técnicos.
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {rows.length > 0 && (
              <Box>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <TuneOutlinedIcon color="action" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" fontWeight={900}>
                      Página {page} de {totalPages}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Eventos {pageStart}-{pageEnd} de {rows.length}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progressValue} sx={{ height: 8, borderRadius: 999 }} />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyActivityMessage />
      ) : (
        <>
          <Stack spacing={1.5} data-testid="seller-activity-results-list">
            {visibleRows.map((log) => (
              <TimelineActivityCard key={log.id} log={log} />
            ))}
          </Stack>

          {totalPages > 1 && (
            <Card variant="outlined" data-testid="seller-activity-pagination">
              <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Typography variant="body2" color="text.secondary">
                    Página {page} de {totalPages}. Eventos {pageStart}-{pageEnd} de {rows.length}.
                  </Typography>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    size="small"
                    shape="rounded"
                    color="primary"
                    siblingCount={0}
                  />
                </Stack>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Stack>
  );
}
