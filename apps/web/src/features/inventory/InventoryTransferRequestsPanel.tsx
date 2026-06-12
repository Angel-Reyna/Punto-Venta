import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { alpha } from "@mui/material/styles";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

import {
  getInventoryTransferFormDisabledReason,
  getWarehouseStockForProduct,
  initialInventoryTransferRequestForm,
  INVENTORY_TRANSFER_STATUS_COLORS,
  INVENTORY_TRANSFER_STATUS_LABELS,
} from "./inventoryShared";
import type {
  InventoryTransferRequest,
  InventoryTransferRequestForm,
  Product,
  StockItem,
  Warehouse,
} from "./inventoryShared";

const TRANSFER_REVIEW_TITLES = {
  approve: "Aprobar solicitud de asignación",
  reject: "Rechazar solicitud de asignación",
} as const;

const TRANSFER_PAGE_SIZE_OPTIONS = [5, 10] as const;
type TransferPageSize = (typeof TRANSFER_PAGE_SIZE_OPTIONS)[number];
type TransferStatusFilter = InventoryTransferRequest["status"];

const TRANSFER_STATUS_FILTERS: Array<{ label: string; value: TransferStatusFilter }> = [
  { label: "Pendientes", value: "PENDING" },
  { label: "Aprobadas", value: "APPROVED" },
  { label: "Rechazadas", value: "REJECTED" },
];

type ReviewMode = keyof typeof TRANSFER_REVIEW_TITLES;

type ReviewDialogState = {
  mode: ReviewMode;
  request: InventoryTransferRequest;
} | null;

export function InventoryTransferRequestsPanel({
  canCreateTransferRequest,
  canReviewTransferRequest,
  initialProductId,
  isSubmitting,
  onApprove,
  onCreate,
  onReject,
  products,
  requests,
  stockRows,
  warehouses,
}: {
  canCreateTransferRequest: boolean;
  canReviewTransferRequest: boolean;
  initialProductId?: string;
  isSubmitting: boolean;
  onApprove: (requestId: string, payload: { reviewNote?: string | null }) => Promise<boolean>;
  onCreate: (payload: {
    fromWarehouseId?: string | null;
    reason: string;
    items: Array<{ productId: string; quantity: number }>;
  }) => Promise<boolean>;
  onReject: (requestId: string, payload: { reviewNote?: string | null }) => Promise<boolean>;
  products: Product[];
  requests: InventoryTransferRequest[];
  stockRows: StockItem[];
  warehouses: Warehouse[];
}) {
  const [form, setForm] = useState(initialInventoryTransferRequestForm);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>(null);
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TransferPageSize>(5);

  useEffect(() => {
    if (!initialProductId) {
      return;
    }

    setForm((current) =>
      current.productId === initialProductId
        ? current
        : {
            ...current,
            productId: initialProductId,
            quantity: 0,
          },
    );
  }, [initialProductId]);

  const pendingRequests = requests.filter((request) => request.status === "PENDING");
  const selectedWarehouseId = form.fromWarehouseId || warehouses[0]?.id || "";
  const selectedProduct = products.find((product) => product.id === form.productId);
  const availableStock = selectedProduct
    ? getWarehouseStockForProduct({
        defaultWarehouseId: warehouses[0]?.id,
        productId: selectedProduct.id,
        stockRows,
        warehouseId: selectedWarehouseId,
      })
    : 0;
  const hasPendingDuplicate = pendingRequests.some((request) => {
    if (request.fromWarehouse.id !== selectedWarehouseId) {
      return false;
    }

    return request.items.some((item) => item.productId === form.productId);
  });
  const disabledReason = hasPendingDuplicate
    ? "Ya existe una solicitud pendiente para este producto y almacén."
    : getInventoryTransferFormDisabledReason({
        availableStock,
        form: {
          ...form,
          fromWarehouseId: selectedWarehouseId,
        },
      });
  const reviewNoteDisabled = reviewDialog?.mode === "reject" && reviewNote.trim().length < 3;

  const requestSummary = useMemo(() => getTransferRequestSummary(requests), [requests]);
  const filteredRequests = useMemo(
    () => sortTransferRequests(requests.filter((request) => request.status === statusFilter)),
    [requests, statusFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const visibleRequests = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filteredRequests, pageSize, statusFilter]);

  function updateForm(patch: Partial<InventoryTransferRequestForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handlePageSizeChange(event: SelectChangeEvent) {
    setPageSize(Number(event.target.value) as TransferPageSize);
    setPage(1);
  }

  async function submitTransferRequest() {
    const success = await onCreate({
      fromWarehouseId: selectedWarehouseId,
      reason: form.reason.trim(),
      items: [
        {
          productId: form.productId,
          quantity: form.quantity,
        },
      ],
    });

    if (success) {
      setForm(initialInventoryTransferRequestForm);
    }
  }

  function openReviewDialog(mode: ReviewMode, request: InventoryTransferRequest) {
    setReviewNote("");
    setReviewDialog({ mode, request });
  }

  async function submitReview() {
    if (!reviewDialog) {
      return;
    }

    const payload = {
      reviewNote: reviewNote.trim() || null,
    };
    const success = reviewDialog.mode === "approve"
      ? await onApprove(reviewDialog.request.id, payload)
      : await onReject(reviewDialog.request.id, payload);

    if (success) {
      setStatusFilter(reviewDialog.mode === "approve" ? "APPROVED" : "REJECTED");
      setReviewDialog(null);
      setReviewNote("");
    }
  }

  return (
    <Stack spacing={2} data-testid="inventory-transfer-requests-panel">
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
            <Box>
              <Typography component="h2" variant="h6" fontWeight={900}>
                Asignaciones de stock
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Solicitudes para asignar producto físico desde almacén a vendedores con aprobación administrativa.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <SummaryChip label="Pendientes" value={requestSummary.pending} color="warning" />
              <SummaryChip label="Aprobadas" value={requestSummary.approved} color="success" />
              <SummaryChip label="Rechazadas" value={requestSummary.rejected} color="error" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {canCreateTransferRequest && (
        <Card variant="outlined" data-testid="inventory-transfer-create-card">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalShippingIcon color="primary" />
                <Box>
                  <Typography component="h3" fontWeight={900}>
                    Solicitar asignación de stock
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    La solicitud queda pendiente hasta que un administrador la apruebe.
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Almacén origen"
                    value={selectedWarehouseId}
                    SelectProps={{ native: true }}
                    inputProps={{ "data-testid": "inventory-transfer-warehouse" }}
                    onChange={(event) => updateForm({ fromWarehouseId: event.target.value })}
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Producto"
                    value={form.productId}
                    SelectProps={{ native: true }}
                    inputProps={{ "data-testid": "inventory-transfer-product" }}
                    onChange={(event) => updateForm({ productId: event.target.value, quantity: 0 })}
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} · {product.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    value={form.quantity > 0 ? String(form.quantity) : ""}
                    helperText={selectedProduct ? `Disponible en origen: ${availableStock}` : "Selecciona producto para ver stock."}
                    inputProps={{
                      "data-testid": "inventory-transfer-quantity",
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      max: availableStock,
                    }}
                    onChange={(event) => updateForm({ quantity: parsePositiveInteger(event.target.value) })}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Motivo"
                    value={form.reason}
                    helperText="Ejemplo: surtir ruta de ventas del día."
                    inputProps={{ "data-testid": "inventory-transfer-reason" }}
                    onChange={(event) => updateForm({ reason: event.target.value })}
                  />
                </Grid>
              </Grid>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Button
                  variant="contained"
                  disabled={Boolean(disabledReason) || isSubmitting}
                  onClick={submitTransferRequest}
                  data-testid="inventory-transfer-submit"
                >
                  Enviar solicitud
                </Button>
                {disabledReason && (
                  <Typography color="text.secondary" variant="body2">
                    {disabledReason}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
              <Box>
                <Typography component="h3" fontWeight={900}>
                  Historial de asignaciones
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Selecciona pendientes, aprobadas o rechazadas para revisar cada grupo sin mezclar estados.
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Tabs
                  value={statusFilter}
                  onChange={(_, value: TransferStatusFilter) => setStatusFilter(value)}
                  aria-label="Secciones de historial de asignaciones"
                  variant="scrollable"
                  allowScrollButtonsMobile
                  sx={(theme) => ({
                    minHeight: 38,
                    maxWidth: { xs: "100%", sm: 420 },
                    "& .MuiTab-root": {
                      border: "1px solid",
                      borderColor: alpha(theme.palette.divider, 0.9),
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 900,
                      minHeight: 36,
                      minWidth: 0,
                      mx: 0.25,
                      px: 1.5,
                      textTransform: "none",
                    },
                    "& .Mui-selected": {
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                    },
                    "& .MuiTabs-indicator": { display: "none" },
                  })}
                >
                  {TRANSFER_STATUS_FILTERS.map((option) => (
                    <Tab key={option.value} label={option.label} value={option.value} />
                  ))}
                </Tabs>

                <FormControl size="small" sx={{ minWidth: 142 }}>
                  <InputLabel id="inventory-transfer-page-size-label">Por página</InputLabel>
                  <Select
                    labelId="inventory-transfer-page-size-label"
                    id="inventory-transfer-page-size"
                    label="Por página"
                    value={String(pageSize)}
                    onChange={handlePageSizeChange}
                  >
                    {TRANSFER_PAGE_SIZE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={String(option)}>
                        {option} solicitudes
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {filteredRequests.length === 0 ? (
              <Box sx={(theme) => ({
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                p: 2,
              })}>
                <Typography fontWeight={800}>Sin solicitudes en esta sección.</Typography>
                <Typography color="text.secondary" variant="body2">
                  Cambia de sección para revisar solicitudes con otro estado.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {visibleRequests.map((request) => (
                  <TransferRequestCard
                    key={request.id}
                    canReview={canReviewTransferRequest}
                    isSubmitting={isSubmitting}
                    onApprove={() => openReviewDialog("approve", request)}
                    onReject={() => openReviewDialog("reject", request)}
                    request={request}
                  />
                ))}

                {pageCount > 1 ? (
                  <Box sx={{ display: "flex", justifyContent: "center", pt: 0.5 }}>
                    <Pagination
                      color="primary"
                      count={pageCount}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                    />
                  </Box>
                ) : null}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(reviewDialog)}
        onClose={() => setReviewDialog(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="inventory-transfer-review-title"
      >
        <DialogTitle id="inventory-transfer-review-title">
          {reviewDialog ? TRANSFER_REVIEW_TITLES[reviewDialog.mode] : "Revisar solicitud"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {reviewDialog?.mode === "approve"
                ? "Al aprobar se asignará stock del almacén origen al stock físico del vendedor."
                : "Al rechazar, la solicitud quedará cerrada sin mover inventario."}
            </Typography>
            {reviewDialog && (
              <Typography fontWeight={800}>
                {reviewDialog.request.requestedBy.name} · {reviewDialog.request.totalUnits} unidades
              </Typography>
            )}
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={reviewDialog?.mode === "reject" ? "Nota de rechazo" : "Nota de aprobación"}
              value={reviewNote}
              helperText={reviewDialog?.mode === "reject" ? "Obligatoria para rechazar." : "Opcional."}
              inputProps={{ "data-testid": "inventory-transfer-review-note" }}
              onChange={(event) => setReviewNote(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={reviewDialog?.mode === "reject" ? "error" : "primary"}
            disabled={isSubmitting || reviewNoteDisabled}
            onClick={submitReview}
            data-testid="inventory-transfer-review-submit"
          >
            {reviewDialog?.mode === "reject" ? "Rechazar" : "Aprobar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function SummaryChip({
  color,
  label,
  value,
}: {
  color: "warning" | "success" | "error";
  label: string;
  value: number;
}) {
  return <Chip color={color} label={`${label}: ${value}`} variant="outlined" />;
}

function TransferRequestCard({
  canReview,
  isSubmitting,
  onApprove,
  onReject,
  request,
}: {
  canReview: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onReject: () => void;
  request: InventoryTransferRequest;
}) {
  const isPending = request.status === "PENDING";
  const statusColor = INVENTORY_TRANSFER_STATUS_COLORS[request.status];
  const StatusIcon = request.status === "PENDING"
    ? PendingActionsIcon
    : request.status === "APPROVED"
      ? CheckCircleIcon
      : RemoveCircleOutlineIcon;

  return (
    <Box
      data-testid={`inventory-transfer-request-${request.id}`}
      sx={(theme) => ({
        border: 1,
        borderColor: alpha(theme.palette[statusColor].main, 0.32),
        borderRadius: 3,
        p: { xs: 1.25, md: 1.5 },
        bgcolor: alpha(theme.palette[statusColor].main, theme.palette.mode === "dark" ? 0.08 : 0.04),
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Inventory2Icon color="primary" />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {request.fromWarehouse.name} → {request.toWarehouse.name}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Solicitó: {request.requestedBy.name} · {formatInventoryDate(request.createdAt)}
              </Typography>
            </Box>
          </Stack>

          <Chip
            color={statusColor}
            icon={<StatusIcon />}
            label={INVENTORY_TRANSFER_STATUS_LABELS[request.status]}
            variant="outlined"
          />
        </Stack>

        <Divider />

        <Stack spacing={0.5}>
          {request.items.map((item) => (
            <Typography key={item.id} variant="body2">
              {item.quantity}× {item.productSku} · {item.productName}
            </Typography>
          ))}
        </Stack>

        <Typography color="text.secondary" variant="body2">
          Motivo: {request.reason}
        </Typography>

        {request.reviewNote && (
          <Typography color="text.secondary" variant="body2">
            Nota de revisión: {request.reviewNote}
          </Typography>
        )}

        {canReview && isPending && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              disabled={isSubmitting}
              onClick={onApprove}
              data-testid={`inventory-transfer-approve-${request.id}`}
            >
              Aprobar
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={isSubmitting}
              onClick={onReject}
              data-testid={`inventory-transfer-reject-${request.id}`}
            >
              Rechazar
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function sortTransferRequests(requests: InventoryTransferRequest[]) {
  const statusPriority: Record<InventoryTransferRequest["status"], number> = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
  };

  return [...requests].sort((left, right) => {
    const statusOrder = statusPriority[left.status] - statusPriority[right.status];

    if (statusOrder !== 0) return statusOrder;

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function getTransferRequestSummary(requests: InventoryTransferRequest[]) {
  return requests.reduce(
    (summary, request) => {
      if (request.status === "PENDING") summary.pending += 1;
      if (request.status === "APPROVED") summary.approved += 1;
      if (request.status === "REJECTED") summary.rejected += 1;

      return summary;
    },
    {
      approved: 0,
      pending: 0,
      rejected: 0,
    },
  );
}

function parsePositiveInteger(value: string) {
  const parsedValue = Number.parseInt(value.replace(/\D/gu, ""), 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatInventoryDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
