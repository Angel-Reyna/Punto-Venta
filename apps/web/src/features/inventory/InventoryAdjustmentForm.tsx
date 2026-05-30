import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import type {
  InventoryMovementForm,
  Product,
  Warehouse,
} from "./inventoryShared";
import { WAREHOUSE_INFO_TEXT } from "./inventoryShared";

type InventoryAdjustmentType = "in" | "out";

type InventoryAdjustmentFormProps = {
  canAdjustInventory: boolean;
  disabledReason: string;
  form: InventoryMovementForm;
  isInvalid: boolean;
  onChange: (form: InventoryMovementForm) => void;
  onSubmit: (type: InventoryAdjustmentType) => void;
  products: Product[];
  warehouses: Warehouse[];
};

export function InventoryAdjustmentForm({
  canAdjustInventory,
  disabledReason,
  form,
  isInvalid,
  onChange,
  onSubmit,
  products,
  warehouses,
}: InventoryAdjustmentFormProps) {
  function updateForm(patch: Partial<InventoryMovementForm>) {
    onChange({
      ...form,
      ...patch,
    });
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Registrar entrada o salida manual
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usa esta sección para ajustes justificados. Las ventas y
                devoluciones generan movimientos automáticamente.
              </Typography>
            </Box>

            <Box
              sx={(theme) => ({
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                bgcolor: theme.palette.background.default,
                px: 1.5,
                py: 1,
                maxWidth: { xs: "100%", md: 320 },
              })}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                Antes de guardar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verifica producto, cantidad y motivo. Este registro queda en el
                historial de inventario.
              </Typography>
            </Box>
          </Stack>

          {canAdjustInventory ? (
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={7}>
                <TextField
                  select
                  fullWidth
                  label="Producto"
                  value={form.productId}
                  inputProps={{
                    "data-testid": "inventory-form-product",
                  }}
                  onChange={(event) =>
                    updateForm({ productId: event.target.value })
                  }
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.sku} · {product.name} · stock {product.stock}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  select
                  fullWidth
                  label={
                    <LabelWithInfo
                      label="Almacén"
                      info={WAREHOUSE_INFO_TEXT}
                      ariaLabel={WAREHOUSE_INFO_TEXT}
                    />
                  }
                  value={form.warehouseId}
                  onChange={(event) =>
                    updateForm({ warehouseId: event.target.value })
                  }
                  helperText="Si no eliges almacén, se usará el principal"
                >
                  <MenuItem value="">Almacén principal automático</MenuItem>

                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Cantidad"
                  type="number"
                  value={form.quantity}
                  inputProps={{
                    "data-testid": "inventory-form-quantity",
                    min: 1,
                  }}
                  onChange={(event) =>
                    updateForm({ quantity: Number(event.target.value) })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Motivo del movimiento"
                  value={form.reason}
                  helperText="Ej. Compra a proveedor, merma, conteo físico"
                  inputProps={{
                    "data-testid": "inventory-form-reason",
                  }}
                  onChange={(event) => updateForm({ reason: event.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    alignItems: { xs: "stretch", sm: "flex-start" },
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    onClick={() => onSubmit("in")}
                    disabled={isInvalid}
                    data-testid="inventory-submit-in"
                  >
                    Registrar entrada
                  </Button>

                  <Button
                    color="warning"
                    onClick={() => onSubmit("out")}
                    disabled={isInvalid}
                    data-testid="inventory-submit-out"
                  >
                    Registrar salida
                  </Button>
                </Stack>

                <ActionDisabledReason message={isInvalid ? disabledReason : ""} />
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">
              Tu usuario puede consultar inventario, pero no registrar ajustes
              manuales.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
