import { Box, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { formatMoney, warehouseTypeLabel, type SalesWarehouseOption } from "./salesShared";

export type SalesSourceWarehousePanelProps = {
  cartItemsCount: number;
  isDisabled: boolean;
  selectedWarehouseId: string;
  selectedWarehouse: SalesWarehouseOption | null;
  total: number;
  warehouseOptions: SalesWarehouseOption[];
  onWarehouseChange: (warehouseId: string) => void;
};

export function SalesSourceWarehousePanel({
  cartItemsCount,
  isDisabled,
  selectedWarehouseId,
  selectedWarehouse,
  total,
  warehouseOptions,
  onWarehouseChange,
}: SalesSourceWarehousePanelProps) {
  return (
    <Card data-testid="sales-source-warehouse-panel" variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ display: "grid", gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="overline" color="primary" fontWeight={900}>
              Paso 0 · Almacén de salida
            </Typography>
            <Typography variant="body2" color="text.secondary">
              La venta descuenta stock del almacén elegido. Cambiarlo limpia el ticket para evitar mezclar existencias.
            </Typography>
          </Box>

          {selectedWarehouse && (
            <Chip
              size="small"
              variant="outlined"
              color={selectedWarehouse.type === "SELLER" ? "success" : "primary"}
              label={warehouseTypeLabel(selectedWarehouse.type)}
            />
          )}
        </Stack>

        <TextField
          select
          label="Almacén para vender"
          value={selectedWarehouseId}
          onChange={(event) => onWarehouseChange(event.target.value)}
          disabled={isDisabled || warehouseOptions.length === 0}
          inputProps={{
            "data-testid": "sales-source-warehouse",
          }}
          helperText={
            selectedWarehouse
              ? `${selectedWarehouse.totalUnits} unidades disponibles en esta ubicación.`
              : "Se usará el almacén principal por compatibilidad."
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
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            gap: 1,
            borderRadius: 2,
            bgcolor: "action.hover",
            p: 1.25,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Ubicación
            </Typography>
            <Typography fontWeight={900} noWrap>
              {selectedWarehouse?.name ?? "Principal"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              En ticket
            </Typography>
            <Typography fontWeight={900}>{cartItemsCount} unidades</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total actual
            </Typography>
            <Typography fontWeight={900}>{formatMoney(total)}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
