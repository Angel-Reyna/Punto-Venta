import { useEffect, useMemo, useState, type MouseEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

import { ResponsiveDialog } from "../../components/ResponsiveDialog";

import {
  adjustmentRequestStatusColor,
  adjustmentRequestStatusLabel,
  adjustmentRequestTypeLabel,
  formatMoney,
  paymentMethodLabel,
  type SalesAdjustmentRequest,
} from "./salesShared";

type ReviewAction = "approve" | "reject";
type AdjustmentRequestView = "pending" | "approved";

const ADJUSTMENT_PAGE_SIZE_OPTIONS = [5, 10] as const;

type SalesAdjustmentRequestsPanelProps = {
  adjustmentRequests: SalesAdjustmentRequest[];
  canReviewAdjustmentRequests: boolean;
  isSubmitting: boolean;
  onApproveAdjustmentRequest: (requestId: string, reviewNote?: string) => Promise<void>;
  onRejectAdjustmentRequest: (requestId: string, reviewNote?: string) => Promise<void>;
};

function requestItemsSummary(request: SalesAdjustmentRequest) {
  if (request.type === "CANCEL_SALE") {
    return "Cancelación completa de la venta";
  }

  if (!request.items?.length) {
    return "Sin productos capturados";
  }

  return request.items
    .map((item) => `${item.quantity}× ${item.product?.name ?? item.productName ?? "Producto"}`)
    .join(" · ");
}

function requestReviewerLabel(request: SalesAdjustmentRequest) {
  if (request.status === "PENDING") {
    return "Pendiente de revisión";
  }

  const reviewer = request.reviewedBy?.name ?? "Administrador";
  const date = request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : "sin fecha";

  return `${reviewer} · ${date}`;
}

function sortRequestsByRecentActivity(requests: SalesAdjustmentRequest[]) {
  return [...requests].sort((first, second) => {
    const firstDate = new Date(first.reviewedAt ?? first.createdAt).getTime();
    const secondDate = new Date(second.reviewedAt ?? second.createdAt).getTime();

    return secondDate - firstDate;
  });
}

export function SalesAdjustmentRequestsPanel({
  adjustmentRequests,
  canReviewAdjustmentRequests,
  isSubmitting,
  onApproveAdjustmentRequest,
  onRejectAdjustmentRequest,
}: SalesAdjustmentRequestsPanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<SalesAdjustmentRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("approve");
  const [reviewNote, setReviewNote] = useState("");
  const [requestView, setRequestView] = useState<AdjustmentRequestView>("pending");
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState<(typeof ADJUSTMENT_PAGE_SIZE_OPTIONS)[number]>(5);

  const pendingRequests = useMemo(
    () => sortRequestsByRecentActivity(adjustmentRequests.filter((request) => request.status === "PENDING")),
    [adjustmentRequests],
  );

  const approvedRequests = useMemo(
    () => sortRequestsByRecentActivity(adjustmentRequests.filter((request) => request.status === "APPROVED")),
    [adjustmentRequests],
  );

  const pendingPageCount = Math.max(Math.ceil(pendingRequests.length / requestPageSize), 1);
  const safePendingPage = Math.min(pendingPage, pendingPageCount);
  const pendingPageStart = (safePendingPage - 1) * requestPageSize;
  const visiblePendingRequests = pendingRequests.slice(pendingPageStart, pendingPageStart + requestPageSize);
  const visiblePendingFrom = pendingRequests.length === 0 ? 0 : pendingPageStart + 1;
  const visiblePendingTo = Math.min(pendingPageStart + requestPageSize, pendingRequests.length);

  const approvedPageCount = Math.max(Math.ceil(approvedRequests.length / requestPageSize), 1);
  const safeApprovedPage = Math.min(approvedPage, approvedPageCount);
  const approvedPageStart = (safeApprovedPage - 1) * requestPageSize;
  const visibleApprovedRequests = approvedRequests.slice(approvedPageStart, approvedPageStart + requestPageSize);
  const visibleApprovedFrom = approvedRequests.length === 0 ? 0 : approvedPageStart + 1;
  const visibleApprovedTo = Math.min(approvedPageStart + requestPageSize, approvedRequests.length);

  const activeRequests = requestView === "pending" ? visiblePendingRequests : visibleApprovedRequests;
  const activeRequestsTotal = requestView === "pending" ? pendingRequests.length : approvedRequests.length;
  const activePageCount = requestView === "pending" ? pendingPageCount : approvedPageCount;
  const activePage = requestView === "pending" ? safePendingPage : safeApprovedPage;
  const activeVisibleFrom = requestView === "pending" ? visiblePendingFrom : visibleApprovedFrom;
  const activeVisibleTo = requestView === "pending" ? visiblePendingTo : visibleApprovedTo;
  const activeEmptyMessage = requestView === "pending"
    ? canReviewAdjustmentRequests
      ? "No hay solicitudes pendientes por revisar."
      : "No tienes solicitudes pendientes."
    : "Aún no hay solicitudes aprobadas.";

  const reviewDialogOpen = Boolean(selectedRequest);
  const reviewDialogTitle = reviewAction === "approve" ? "Aprobar solicitud" : "Rechazar solicitud";
  const reviewDialogDescription = selectedRequest
    ? `${adjustmentRequestTypeLabel(selectedRequest.type)} · ${selectedRequest.sale?.folio ?? "venta"}`
    : "";

  function handleRequestViewChange(_: MouseEvent<HTMLElement>, nextView: AdjustmentRequestView | null) {
    if (!nextView) return;

    setRequestView(nextView);
  }

  function handleActivePageChange(page: number) {
    if (requestView === "pending") {
      setPendingPage(page);
      return;
    }

    setApprovedPage(page);
  }

  function openReviewDialog(request: SalesAdjustmentRequest, action: ReviewAction) {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNote("");
  }

  function closeReviewDialog() {
    if (isSubmitting) return;

    setSelectedRequest(null);
    setReviewNote("");
  }

  useEffect(() => {
    setPendingPage(1);
    setApprovedPage(1);
  }, [canReviewAdjustmentRequests, requestPageSize]);

  useEffect(() => {
    setPendingPage((currentPage) => Math.min(currentPage, pendingPageCount));
  }, [pendingPageCount]);

  useEffect(() => {
    setApprovedPage((currentPage) => Math.min(currentPage, approvedPageCount));
  }, [approvedPageCount]);

  async function confirmReview() {
    if (!selectedRequest) return;

    const note = reviewNote.trim() || undefined;

    if (reviewAction === "approve") {
      await onApproveAdjustmentRequest(selectedRequest.id, note);
    } else {
      await onRejectAdjustmentRequest(selectedRequest.id, note);
    }

    setSelectedRequest(null);
    setReviewNote("");
  }

  function renderRequestCard(request: SalesAdjustmentRequest) {
    return (
      <Card
        key={request.id}
        variant="outlined"
        data-testid={`sales-adjustment-request-${request.id}`}
        sx={{ boxShadow: "none" }}
      >
        <CardContent sx={{ display: "grid", gap: 1.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "flex-start" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Typography fontWeight={900}>{adjustmentRequestTypeLabel(request.type)}</Typography>
                <Chip
                  size="small"
                  label={adjustmentRequestStatusLabel(request.status)}
                  color={adjustmentRequestStatusColor(request.status)}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {request.sale?.folio ?? "Venta"} · {request.sale ? formatMoney(request.sale.total) : "Sin total"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Solicitó: {request.requestedBy?.name ?? "Usuario"} · {new Date(request.createdAt).toLocaleString()}
              </Typography>
            </Box>

            {canReviewAdjustmentRequests && request.status === "PENDING" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                <Button
                  size="small"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  disabled={isSubmitting}
                  data-testid={`sales-adjustment-approve-${request.id}`}
                  onClick={() => openReviewDialog(request, "approve")}
                >
                  Aprobar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<CloseIcon />}
                  disabled={isSubmitting}
                  data-testid={`sales-adjustment-reject-${request.id}`}
                  onClick={() => openReviewDialog(request, "reject")}
                >
                  Rechazar
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider />

          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Typography variant="body2" fontWeight={800}>
              {requestItemsSummary(request)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Motivo: {request.reason}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Método de devolución: {request.refundMethod ? paymentMethodLabel(request.refundMethod) : "No aplica"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Revisión: {requestReviewerLabel(request)}
            </Typography>
            {request.reviewNote && (
              <Typography variant="caption" color="text.secondary">
                Nota: {request.reviewNote}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="sales-adjustment-requests-panel">
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Solicitudes de ajuste
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canReviewAdjustmentRequests
                ? "Revisa devoluciones y cancelaciones pendientes antes de modificar ventas o inventario."
                : "Consulta tus solicitudes pendientes y el historial aprobado por el administrador."}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={requestView}
              aria-label="Vista de solicitudes de ajuste"
              onChange={handleRequestViewChange}
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                justifyContent: { xs: "stretch", sm: "flex-start" },
                "& .MuiToggleButton-root": {
                  flex: { xs: 1, sm: "initial" },
                  px: 1.5,
                  fontWeight: 800,
                  textTransform: "none",
                },
              }}
            >
              <ToggleButton value="pending" aria-label="Ver solicitudes pendientes">
                Pendientes
              </ToggleButton>
              <ToggleButton value="approved" aria-label="Ver solicitudes aprobadas">
                Aprobadas
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              select
              size="small"
              label="Por página"
              value={requestPageSize}
              onChange={(event) => {
                setRequestPageSize(Number(event.target.value) as (typeof ADJUSTMENT_PAGE_SIZE_OPTIONS)[number]);
              }}
              sx={{ width: { xs: "100%", sm: 104 }, minWidth: { xs: "100%", sm: 104 } }}
            >
              {ADJUSTMENT_PAGE_SIZE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box>
              <Typography fontWeight={900}>
                {requestView === "pending" ? "Pendientes" : "Aprobadas"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {requestView === "pending"
                  ? "Solicitudes que todavía necesitan revisión."
                  : "Historial de solicitudes aprobadas y ya revisadas."}
              </Typography>
            </Box>

            {activeRequests.length === 0 ? (
              <Alert severity="info">{activeEmptyMessage}</Alert>
            ) : (
              <Box sx={{ display: "grid", gap: 1.5 }}>{activeRequests.map((request) => renderRequestCard(request))}</Box>
            )}

            {activeRequestsTotal > 0 && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography variant="caption" color="text.secondary">
                  Mostrando {activeVisibleFrom}-{activeVisibleTo} de {activeRequestsTotal} {requestView === "pending" ? "pendientes" : "aprobadas"}
                </Typography>
                <Pagination
                  count={activePageCount}
                  page={activePage}
                  onChange={(_, page) => handleActivePageChange(page)}
                  size="small"
                  shape="rounded"
                  color="primary"
                />
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={reviewDialogOpen}
        onClose={closeReviewDialog}
        disableClose={isSubmitting}
        maxWidth="sm"
        title={reviewDialogTitle}
        description={reviewDialogDescription}
        actions={
          <>
            <Button variant="outlined" onClick={closeReviewDialog} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button
              color={reviewAction === "approve" ? "success" : "error"}
              disabled={isSubmitting}
              data-testid="sales-adjustment-review-submit"
              onClick={() => void confirmReview()}
            >
              {reviewAction === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Alert severity={reviewAction === "approve" ? "warning" : "info"}>
            {reviewAction === "approve"
              ? "Al aprobar se ejecutará el ajuste real sobre la venta y el inventario."
              : "Al rechazar no se modifica la venta ni el inventario."}
          </Alert>

          <TextField
            label="Nota de revisión"
            value={reviewNote}
            multiline
            minRows={3}
            inputProps={{ "data-testid": "sales-adjustment-review-note" }}
            helperText="Opcional. Útil para explicar la aprobación o el rechazo."
            onChange={(event) => setReviewNote(event.target.value)}
          />
        </Box>
      </ResponsiveDialog>
    </>
  );
}
