import type { ReactElement } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import TuneIcon from "@mui/icons-material/Tune";

import { EmptyStatePanel } from "../../components/data-display";
import type { InventoryMetricColor, Movement } from "./inventoryShared";

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

export function InventoryMovementTimeline({
  movements,
  searchQuery,
}: {
  movements: Movement[];
  searchQuery: string;
}) {
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
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
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

            <Chip
              color="primary"
              variant="outlined"
              label={`${movements.length} movimiento${movements.length === 1 ? "" : "s"}`}
            />
          </Stack>
        </Box>

        <Stack sx={{ p: { xs: 1.5, sm: 2.5 } }} spacing={1.5}>
          {movements.map((movement, index) => {
            const meta = getMovementTypeMeta(movement.type);
            const productSku = movement.product?.sku ?? movement.productSku;
            const productName =
              movement.product?.name ?? `${movement.productName} (eliminado)`;
            const barcode = movement.product?.barcode;

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
                  {index < movements.length - 1 && (
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
                            Producto afectado
                          </Typography>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip size="small" variant="outlined" label={productSku} />
                            {barcode && (
                              <Chip size="small" variant="outlined" label={barcode} />
                            )}
                            <Chip
                              size="small"
                              variant="outlined"
                              label={movement.warehouse?.name ?? "Sin almacén"}
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
                          <Typography variant="body2" color="text.secondary">
                            {movement.reason || "Sin motivo capturado."}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
