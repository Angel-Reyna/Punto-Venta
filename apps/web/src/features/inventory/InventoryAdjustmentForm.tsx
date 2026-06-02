import { useMemo, useState } from "react";

import {
  Autocomplete,
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
import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import type { CreateWarehousePayload } from "./inventoryApi";
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
  isCreatingWarehouse: boolean;
  isInvalid: boolean;
  onChange: (form: InventoryMovementForm) => void;
  onCreateWarehouse: (
    payload: CreateWarehousePayload,
  ) => Promise<Warehouse | null>;
  onSubmit: (type: InventoryAdjustmentType) => void;
  products: Product[];
  warehouses: Warehouse[];
};

function normalizeWarehouseInput(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function InventoryAdjustmentForm({
  canAdjustInventory,
  disabledReason,
  form,
  isCreatingWarehouse,
  isInvalid,
  onChange,
  onCreateWarehouse,
  onSubmit,
  products,
  warehouses,
}: InventoryAdjustmentFormProps) {
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseDescription, setWarehouseDescription] = useState("");

  function updateForm(patch: Partial<InventoryMovementForm>) {
    onChange({
      ...form,
      ...patch,
    });
  }

  function resetWarehouseDialog() {
    setWarehouseDialogOpen(false);
    setWarehouseName("");
    setWarehouseDescription("");
  }

  function closeWarehouseDialog() {
    if (isCreatingWarehouse) {
      return;
    }

    resetWarehouseDialog();
  }

  async function submitWarehouseCreation() {
    const createdWarehouse = await onCreateWarehouse({
      name: normalizeWarehouseInput(warehouseName),
      description: normalizeWarehouseInput(warehouseDescription) || null,
    });

    if (!createdWarehouse) {
      return;
    }

    updateForm({ warehouseId: createdWarehouse.id });
    resetWarehouseDialog();
  }

  const isExpirationReason = form.reasonType === "EXPIRATION";
  const isInDisabled = isInvalid || isExpirationReason;
  const selectedProduct = products.find(
    (product) => product.id === form.productId,
  );
  const selectedWarehouse = useMemo(
    () =>
      warehouses.find((warehouse) => warehouse.id === form.warehouseId) ?? null,
    [form.warehouseId, warehouses],
  );
  const expirationLossPreview = isExpirationReason
    ? Number(selectedProduct?.costPrice ?? 0) *
      Math.max(Number(form.quantity) || 0, 0)
    : 0;
  const normalizedWarehouseName = normalizeWarehouseInput(warehouseName);
  const canCreateWarehouse =
    normalizedWarehouseName.length >= 2 && !isCreatingWarehouse;

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
                <Stack spacing={1}>
                  <Autocomplete
                    options={warehouses}
                    value={selectedWarehouse}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.name}
                    noOptionsText="No hay almacenes activos"
                    onChange={(_event, warehouse) =>
                      updateForm({ warehouseId: warehouse?.id ?? "" })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <LabelWithInfo
                            label="Almacén"
                            info={WAREHOUSE_INFO_TEXT}
                            ariaLabel={WAREHOUSE_INFO_TEXT}
                          />
                        }
                        helperText="Busca una ubicación o crea una nueva. Si queda vacío, se usará Principal."
                        inputProps={{
                          ...params.inputProps,
                          "data-testid": "inventory-form-warehouse-search",
                        }}
                      />
                    )}
                  />

                  <Button
                    variant="outlined"
                    onClick={() => setWarehouseDialogOpen(true)}
                    data-testid="inventory-create-warehouse-open"
                  >
                    Crear almacén
                  </Button>
                </Stack>
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
                      reasonType: event.target
                        .value as InventoryMovementForm["reasonType"],
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

      <ResponsiveDialog
        open={warehouseDialogOpen}
        onClose={closeWarehouseDialog}
        disableClose={isCreatingWarehouse}
        maxWidth="xs"
        title="Nuevo almacén"
        description="Registra una ubicación para separar existencias."
        actions={
          <>
            <Button
              variant="outlined"
              onClick={closeWarehouseDialog}
              disabled={isCreatingWarehouse}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="inventory-create-warehouse-form"
              disabled={!canCreateWarehouse}
              data-testid="inventory-create-warehouse-submit"
            >
              {isCreatingWarehouse ? "Creando..." : "Crear almacén"}
            </Button>
          </>
        }
      >
        <Box
          id="inventory-create-warehouse-form"
          component="form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submitWarehouseCreation();
          }}
          sx={{ pt: { xs: 1, sm: 1.25 } }}
        >
          <Stack spacing={2.25}>
            <Box
              sx={(theme) => ({
                border: 1,
                borderColor: "divider",
                borderRadius: 2.5,
                bgcolor: theme.palette.background.default,
                px: 1.75,
                py: 1.5,
              })}
            >
              <Typography variant="subtitle2" fontWeight={900}>
                Datos de la ubicación
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usa un nombre claro para encontrarla rápido al registrar movimientos.
              </Typography>
            </Box>

            <TextField
              autoFocus
              fullWidth
              label="Nombre del almacén"
              value={warehouseName}
              helperText="Ejemplo: Bodega norte, Mostrador, Sucursal centro."
              inputProps={{
                "data-testid": "inventory-create-warehouse-name",
                maxLength: 80,
              }}
              onChange={(event) => setWarehouseName(event.target.value)}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Descripción opcional"
              value={warehouseDescription}
              helperText="Referencia breve para distinguir la ubicación."
              inputProps={{
                "data-testid": "inventory-create-warehouse-description",
                maxLength: 255,
              }}
              onChange={(event) => setWarehouseDescription(event.target.value)}
            />
          </Stack>
        </Box>
      </ResponsiveDialog>
    </Card>
  );
}
