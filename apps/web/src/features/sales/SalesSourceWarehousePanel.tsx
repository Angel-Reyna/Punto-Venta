import { Alert, Box, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import { warehouseTypeLabel, type SalesWarehouseOption } from "./salesShared";

export type SalesSourceWarehousePanelProps = {
  isDisabled: boolean;
  selectedWarehouseId: string;
  selectedWarehouse: SalesWarehouseOption | null;
  warehouseOptions: SalesWarehouseOption[];
  sellerSaleRequiresAssignedStock: boolean;
  onWarehouseChange: (warehouseId: string) => void;
};

export function SalesSourceWarehousePanel({
  isDisabled,
  selectedWarehouseId,
  selectedWarehouse,
  warehouseOptions,
  sellerSaleRequiresAssignedStock,
  onWarehouseChange,
}: SalesSourceWarehousePanelProps) {
  const selectedWarehouseProductsCount = selectedWarehouse
    ? Object.values(selectedWarehouse.stockByProductId).filter((quantity) => quantity > 0).length
    : 0;

  return (
    <Card
      data-testid="sales-source-warehouse-panel"
      variant="outlined"
      sx={(theme) => ({
        boxShadow: "none",
        borderRadius: 3,
        overflow: "hidden",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(15,23,42,0.88))"
            : "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(255,255,255,0.94))",
      })}
    >
      <CardContent sx={{ display: "grid", gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", lg: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                flex: "0 0 auto",
              }}
            >
              <WarehouseIcon />
            </Box>

            <Box>
              <Typography variant="overline" color="primary" fontWeight={900}>
                Almacén de salida
              </Typography>
              <Typography variant="h6" fontWeight={900} letterSpacing="-0.025em">
                Elige de dónde saldrá la venta
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                Este campo controla qué productos aparecen en “Elegir productos”. Si no ves un producto, revisa primero el almacén seleccionado.
              </Typography>
            </Box>
          </Stack>

          {selectedWarehouse && (
            <Chip
              size="small"
              variant="outlined"
              color={selectedWarehouse.type === "SELLER" ? "success" : "primary"}
              icon={selectedWarehouse.type === "SELLER" ? <StorefrontIcon /> : <Inventory2Icon />}
              label={warehouseTypeLabel(selectedWarehouse.type)}
              sx={{ fontWeight: 800 }}
            />
          )}
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(260px, 0.95fr) minmax(0, 1.05fr)" },
            gap: 1.25,
            alignItems: "stretch",
          }}
        >
          <TextField
            select
            label="Almacén para vender · controla productos visibles"
            value={selectedWarehouseId}
            onChange={(event) => onWarehouseChange(event.target.value)}
            disabled={isDisabled || warehouseOptions.length === 0}
            inputProps={{
              "data-testid": "sales-source-warehouse",
            }}
            helperText={
              selectedWarehouse
                ? `${selectedWarehouseProductsCount} productos con stock · ${selectedWarehouse.totalUnits} unidades disponibles.`
                : sellerSaleRequiresAssignedStock
                  ? "No tienes stock asignado disponible para vender. Solicita retiro al administrador."
                  : "Selecciona el origen de venta para ver productos disponibles."
            }
          >
            {warehouseOptions.map((warehouse) => (
              <MenuItem key={warehouse.id || "default"} value={warehouse.id}>
                {warehouse.name} · {warehouse.totalUnits} unidades
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1,
              borderRadius: 2.5,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              p: 1.25,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Origen visible
              </Typography>
              <Typography fontWeight={900} noWrap>
                {selectedWarehouse?.name ?? "Principal"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Productos visibles
              </Typography>
              <Typography fontWeight={900}>{selectedWarehouseProductsCount} productos</Typography>
            </Box>
          </Box>
        </Box>

        {selectedWarehouse && (
          <Alert
            severity={selectedWarehouse.totalUnits > 0 ? "info" : "warning"}
            sx={{
              border: "1px solid",
              borderColor: selectedWarehouse.totalUnits > 0 ? "info.light" : "warning.light",
              alignItems: "center",
            }}
          >
            Estás viendo productos de <strong>{selectedWarehouse.name}</strong>.
            {" "}
            {selectedWarehouseProductsCount > 0
              ? `${selectedWarehouseProductsCount} productos tienen stock para venta.`
              : "No hay productos con stock en este almacén."}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
