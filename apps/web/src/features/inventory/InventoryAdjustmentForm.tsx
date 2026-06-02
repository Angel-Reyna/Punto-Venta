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
import {
  formatInventoryMoney,
  INVENTORY_REASON_TYPE_LABELS,
  WAREHOUSE_INFO_TEXT,
} from "./inventoryShared";

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

  const isExpirationReason = form.reasonType === "EXPIRATION";
  const isInDisabled = isInvalid || isExpirationReason;
  const selectedProduct = products.find(
    (product) => product.id === form.productId,
  );
  const expirationLossPreview = isExpirationReason
    ? Number(selectedProduct?.costPrice ?? 0) *
      Math.max(Number(form.quantity) || 0, 0)
    : 0;

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
                Registrar movimiento manual
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Captura entradas por compra o salidas justificadas. Caducidad se
                reporta como merma en dinero dentro del dashboard.
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
                Control administrativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verifica producto, almacén, cantidad y motivo antes de afectar
                existencias.
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

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Motivo"
                  value={form.reasonType}
                  inputProps={{
                    "data-testid": "inventory-form-reason-type",
                  }}
                  onChange={(event) =>
                    updateForm({
                      reasonType: event.target.value as InventoryMovementForm["reasonType"],
                      reason: event.target.value === "EXPIRATION" ? "" : form.reason,
                    })
                  }
                  helperText="Caducidad se reporta como merma en dinero"
                >
                  <MenuItem value="OTHER">{INVENTORY_REASON_TYPE_LABELS.OTHER}</MenuItem>
                  <MenuItem value="EXPIRATION">{INVENTORY_REASON_TYPE_LABELS.EXPIRATION}</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Detalle del motivo"
                  value={isExpirationReason ? "Caducidad" : form.reason}
                  disabled={isExpirationReason}
                  helperText={
                    isExpirationReason
                      ? `Pérdida estimada: ${formatInventoryMoney(expirationLossPreview)}`
                      : "Describe el motivo cuando elijas Otros"
                  }
                  inputProps={{
                    "data-testid": "inventory-form-reason",
                  }}
                  onChange={(event) => updateForm({ reason: event.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={(theme) => ({
                    border: 1,
                    borderColor: isExpirationReason ? "warning.main" : "divider",
                    borderRadius: 3,
                    bgcolor: isExpirationReason
                      ? theme.palette.warning.main + "14"
                      : theme.palette.background.default,
                    px: 2,
                    py: 1.5,
                  })}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" fontWeight={900}>
                      {isExpirationReason ? "Salida por caducidad" : "Movimiento operativo"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isExpirationReason
                        ? `Se descontarán ${form.quantity || 0} unidades y se registrará una merma estimada de ${formatInventoryMoney(expirationLossPreview)}.`
                        : "Las entradas aumentan existencias y las salidas descuentan stock con el motivo capturado."}
                    </Typography>
                  </Stack>
                </Box>
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
                    disabled={isInDisabled}
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

                <ActionDisabledReason
                  message={
                    isInvalid
                      ? disabledReason
                      : isExpirationReason
                        ? "Caducidad solo se registra como salida."
                        : ""
                  }
                />
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
