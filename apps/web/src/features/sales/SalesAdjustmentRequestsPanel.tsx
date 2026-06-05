import { useMemo, useState } from "react";

import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, TextField, Typography } from "@mui/material";

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

  const pendingRequests = useMemo(
    () => adjustmentRequests.filter((request) => request.status === "PENDING"),
    [adjustmentRequests],
  );

  const reviewedRequests = useMemo(
    () => adjustmentRequests.filter((request) => request.status !== "PENDING"),
    [adjustmentRequests],
  );

  const visibleRequests = canReviewAdjustmentRequests
    ? [...pendingRequests, ...reviewedRequests].slice(0, 8)
    : adjustmentRequests.slice(0, 6);

  const reviewDialogOpen = Boolean(selectedRequest);
  const reviewDialogTitle = reviewAction === "approve" ? "Aprobar solicitud" : "Rechazar solicitud";
  const reviewDialogDescription = selectedRequest
    ? `${adjustmentRequestTypeLabel(selectedRequest.type)} · ${selectedRequest.sale?.folio ?? "venta"}`
    : "";

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

  return (
    <>
      <Card data-testid="sales-adjustment-requests-panel">
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Solicitudes de ajuste
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {canReviewAdjustmentRequests
                  ? "Revisa devoluciones y cancelaciones solicitadas antes de modificar ventas o inventario."
                  : "Consulta el estado de tus devoluciones y cancelaciones solicitadas al administrador."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${pendingRequests.length} pendientes`} color={pendingRequests.length > 0 ? "warning" : "default"} />
              <Chip label={`${adjustmentRequests.length} solicitudes`} />
            </Stack>
          </Stack>

          {visibleRequests.length === 0 ? (
            <Alert severity="info">
              {canReviewAdjustmentRequests
                ? "No hay solicitudes de ajuste pendientes."
                : "Aún no has enviado solicitudes de ajuste."}
            </Alert>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {visibleRequests.map((request) => (
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
              ))}
            </Box>
          )}
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
