import { useEffect, useMemo, useState, type ReactElement } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { alpha } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import TuneIcon from "@mui/icons-material/Tune";

import { EmptyStatePanel } from "../../components/data-display";
import {
  DEFAULT_INVENTORY_ENTRY_REASON,
  formatInventoryMoney,
  INVENTORY_REASON_TYPE_LABELS,
  isInventoryShrinkageReason,
  type InventoryMetricColor,
  type Movement,
} from "./inventoryShared";

const MOVEMENTS_PAGE_SIZE_OPTIONS = [5, 10] as const;

type MovementsPageSize = (typeof MOVEMENTS_PAGE_SIZE_OPTIONS)[number];

function getWarehouseLabel(movement: Movement) {
  const rawName = movement.warehouse?.name?.trim();

  if (!rawName || rawName.toLowerCase() === "principal") {
    return "Almacén: Principal";
  }

  return `Almacén: ${rawName}`;
}

function getMovementReasonText(movement: Movement) {
  const reason = movement.reason?.trim();

  if (movement.type === "IN") {
    return reason || DEFAULT_INVENTORY_ENTRY_REASON;
  }

  if (isInventoryShrinkageReason(movement.reasonType)) {
    return reason || INVENTORY_REASON_TYPE_LABELS[movement.reasonType];
  }

  return reason || "Sin motivo capturado.";
}

function getMovementTypeMeta(type: Movement["type"]): {
  color: InventoryMetricColor;
  icon: ReactElement;
  label: string;
  plainSummary: string;
} {
  const meta: Record<
    Movement["type"],
    {
      color: InventoryMetricColor;
      icon: ReactElement;
      label: string;
      plainSummary: string;
    }
  > = {
    ADJUSTMENT: {
      color: "info",
      icon: <TuneIcon fontSize="small" />,
      label: "Ajuste",
      plainSummary: "Se corrigió el inventario manualmente.",
    },
    IN: {
      color: "success",
      icon: <AddCircleIcon fontSize="small" />,
      label: "Entrada",
      plainSummary: "Entraron unidades al inventario.",
    },
    OUT: {
      color: "warning",
      icon: <RemoveCircleIcon fontSize="small" />,
      label: "Salida",
      plainSummary: "Salieron unidades del inventario.",
    },
    RETURN: {
      color: "success",
      icon: <ReplayIcon fontSize="small" />,
      label: "Devolución",
      plainSummary: "Una devolución regresó unidades al inventario.",
    },
    SALE: {
      color: "warning",
      icon: <LocalShippingIcon fontSize="small" />,
      label: "Venta",
      plainSummary: "Una venta descontó unidades del inventario.",
    },
  };

  return meta[type];
}

function getMovementRangeLabel(page: number, pageSize: number, total: number) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return `Mostrando ${start}-${end} de ${total}`;
}

export function InventoryMovementTimeline({
  movements,
  searchQuery,
}: {
  movements: Movement[];
  searchQuery: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<MovementsPageSize>(5);

  useEffect(() => {
    setPage(1);
  }, [movements, pageSize, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(movements.length / pageSize));
  const visibleMovements = useMemo(() => {
    const start = (page - 1) * pageSize;

    return movements.slice(start, start + pageSize);
  }, [movements, page, pageSize]);

  function handlePageSizeChange(event: SelectChangeEvent) {
    const nextPageSize = Number(event.target.value) as MovementsPageSize;

    setPageSize(nextPageSize);
  }

  if (movements.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <EmptyStatePanel>
            {searchQuery.trim()
              ? "No hay movimientos que coincidan con la búsqueda. Busca por tipo, producto, SKU, almacén o motivo."
              : "No hay movimientos de inventario registrados. Las entradas, salidas, ventas y devoluciones aparecerán aquí con trazabilidad."}
          </EmptyStatePanel>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Historial operativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Línea de tiempo de entradas, salidas, ventas y devoluciones que
                afectan stock.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
            >
              <Chip
                color="primary"
                variant="outlined"
                label={getMovementRangeLabel(page, pageSize, movements.length)}
              />

              <FormControl size="small" sx={{ minWidth: 142 }}>
                <InputLabel id="inventory-movements-page-size-label">
                  Por página
                </InputLabel>
                <Select
                  labelId="inventory-movements-page-size-label"
                  id="inventory-movements-page-size"
                  label="Por página"
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                >
                  {MOVEMENTS_PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={String(option)}>
                      {option} movimientos
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Box>

        <Stack sx={{ p: { xs: 1.5, sm: 2.5 } }} spacing={1.5}>
          {visibleMovements.map((movement, index) => {
            const meta = getMovementTypeMeta(movement.type);
            const productSku = movement.product?.sku ?? movement.productSku;
            const productName =
              movement.product?.name ?? `${movement.productName} (eliminado)`;
            const barcode = movement.product?.barcode;
            const reasonTypeLabel =
              movement.type === "OUT" && isInventoryShrinkageReason(movement.reasonType)
                ? INVENTORY_REASON_TYPE_LABELS[movement.reasonType]
                : null;
            const warehouseLabel = getWarehouseLabel(movement);
            const reasonText = getMovementReasonText(movement);
            const isExpirationMovement = movement.reasonType === "EXPIRATION";
            const costAmount = Number(movement.costAmount ?? 0);

            return (
              <Box
                key={movement.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "auto minmax(0, 1fr)",
                  },
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                <Stack
                  alignItems="center"
                  sx={{ display: { xs: "none", sm: "flex" }, pt: 0.25 }}
                >
                  <Box
                    sx={(theme) => ({
                      display: "grid",
                      placeItems: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      color: theme.palette[meta.color].main,
                      bgcolor: alpha(theme.palette[meta.color].main, 0.12),
                      border: `1px solid ${alpha(
                        theme.palette[meta.color].main,
                        0.28,
                      )}`,
                    })}
                  >
                    {meta.icon}
                  </Box>
                  {index < visibleMovements.length - 1 && (
                    <Box
                      sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.75 }}
                    />
                  )}
                </Stack>

                <Card
                  variant="outlined"
                  data-testid={`inventory-movement-${movement.id}`}
                  sx={(theme) => ({
                    borderColor: alpha(theme.palette[meta.color].main, 0.24),
                    backgroundColor: alpha(theme.palette[meta.color].main, 0.035),
                  })}
                >
                  <CardContent
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Chip
                            color={meta.color}
                            icon={meta.icon}
                            label={meta.label}
                          />
                          <Chip
                            variant="outlined"
                            label={`${movement.quantity} unidad${movement.quantity === 1 ? "" : "es"}`}
                          />
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={800}
                        >
                          {new Date(movement.createdAt).toLocaleString()}
                        </Typography>
                      </Stack>

                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={900}
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {productName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {meta.plainSummary}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box
                        sx={{
                          display: "grid",
                          gap: 1,
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "minmax(0, 1fr) minmax(0, 1fr)",
                          },
                        }}
                      >
                        <Stack spacing={0.75}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={800}
                          >
                            Producto y ubicación
                          </Typography>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Clave interna/SKU: ${productSku}`}
                            />
                            {barcode && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Código del producto: ${barcode}`}
                              />
                            )}
                            <Chip
                              size="small"
                              color="info"
                              variant="outlined"
                              label={warehouseLabel}
                            />
                          </Stack>
                        </Stack>

                        <Stack spacing={0.75}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={800}
                          >
                            Motivo
                          </Typography>
                          <Stack spacing={0.75}>
                            {reasonTypeLabel && (
                              <Chip
                                size="small"
                                color={movement.reasonType === "EXPIRATION" ? "warning" : "default"}
                                variant="outlined"
                                label={reasonTypeLabel}
                                sx={{ alignSelf: "flex-start" }}
                              />
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {reasonText}
                            </Typography>
                            {isExpirationMovement && costAmount > 0 && (
                              <Typography variant="caption" color="warning.main" fontWeight={900}>
                                Merma estimada: {formatInventoryMoney(costAmount)}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Stack>

        {pageCount > 1 && (
          <Box
            sx={{
              px: { xs: 2, sm: 2.5 },
              pb: { xs: 2, sm: 2.5 },
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Pagination
              color="primary"
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
