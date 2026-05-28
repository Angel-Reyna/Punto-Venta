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
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Registrar entrada o salida manual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Usa esta sección para ajustes operativos justificados. Las ventas
              y devoluciones generan movimientos automáticamente.
            </Typography>
          </Box>

          {canAdjustInventory ? (
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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
                  helperText="Mínimo 3 caracteres"
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
