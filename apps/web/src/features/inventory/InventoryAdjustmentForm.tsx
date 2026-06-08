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
import { alpha } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import type { CreateWarehousePayload } from "./inventoryApi";
import type {
  InventoryMovementForm,
  Product,
  StockItem,
  Warehouse,
} from "./inventoryShared";
import {
  formatInventoryMoney,
  getWarehouseStockForProduct,
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
  mode: InventoryAdjustmentType;
  onChange: (form: InventoryMovementForm) => void;
  onCreateWarehouse: (
    payload: CreateWarehousePayload,
  ) => Promise<Warehouse | null>;
  onSubmit: (type: InventoryAdjustmentType) => void;
  products: Product[];
  stockRows: StockItem[];
  warehouses: Warehouse[];
};

function normalizeWarehouseInput(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function formatInventoryUnits(quantity: number) {
  return `${quantity} unidad${quantity === 1 ? "" : "es"}`;
}

function parseQuantityInput(value: string) {
  const onlyDigits = value.replace(/\D/gu, "");

  if (!onlyDigits) {
    return 0;
  }

  const parsedQuantity = Number(onlyDigits);

  if (!Number.isSafeInteger(parsedQuantity)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsedQuantity;
}

export function InventoryAdjustmentForm({
  canAdjustInventory,
  disabledReason,
  form,
  isCreatingWarehouse,
  isInvalid,
  mode,
  onChange,
  onCreateWarehouse,
  onSubmit,
  products,
  stockRows,
  warehouses,
}: InventoryAdjustmentFormProps) {
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseDescription, setWarehouseDescription] = useState("");
  const [quantityLimitMessage, setQuantityLimitMessage] = useState("");

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

  const selectedWarehouse = useMemo(
    () =>
      warehouses.find((warehouse) => warehouse.id === form.warehouseId) ?? null,
    [form.warehouseId, warehouses],
  );
  const defaultWarehouseId = warehouses[0]?.id;
  const effectiveWarehouseId = form.warehouseId || defaultWarehouseId || "";
  const effectiveWarehouseName =
    selectedWarehouse?.name || warehouses[0]?.name || "Principal";

  function getAvailableStockForSelection(
    productId: string,
    warehouseId = form.warehouseId,
  ) {
    return getWarehouseStockForProduct({
      stockRows,
      productId,
      warehouseId,
      defaultWarehouseId,
    });
  }

  function getWarehouseName(warehouseId = form.warehouseId) {
    return (
      warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ||
      warehouses[0]?.name ||
      "Principal"
    );
  }

  function describeWarehouseLimit(
    attemptedQuantity: number,
    availableStock: number,
    warehouseName: string,
  ) {
    if (availableStock <= 0) {
      return `Almacén: ${warehouseName}. No tiene unidades disponibles para salida.`;
    }

    return `Se ajustó la salida de ${formatInventoryUnits(attemptedQuantity)} al máximo disponible. Almacén: ${warehouseName}. Disponible: ${formatInventoryUnits(availableStock)}.`;
  }

  function updateProduct(productId: string) {
    const nextProductStock = getAvailableStockForSelection(productId);
    const shouldClampQuantity = mode === "out" && form.quantity > nextProductStock;

    setQuantityLimitMessage(
      shouldClampQuantity
        ? describeWarehouseLimit(
            form.quantity,
            nextProductStock,
            getWarehouseName(),
          )
        : "",
    );

    updateForm({
      productId,
      quantity: shouldClampQuantity ? nextProductStock : form.quantity,
      reason:
        mode === "out" && form.reason.trim() === "Reabastecimiento"
          ? ""
          : form.reason,
    });
  }

  function updateWarehouse(warehouseId: string) {
    const nextProductStock = form.productId
      ? getAvailableStockForSelection(form.productId, warehouseId)
      : 0;
    const shouldClampQuantity = mode === "out" && form.quantity > nextProductStock;

    setQuantityLimitMessage(
      shouldClampQuantity
        ? describeWarehouseLimit(
            form.quantity,
            nextProductStock,
            getWarehouseName(warehouseId),
          )
        : "",
    );

    updateForm({
      warehouseId,
      quantity: shouldClampQuantity ? nextProductStock : form.quantity,
    });
  }

  function updateQuantity(value: string) {
    const parsedQuantity = parseQuantityInput(value);

    if (mode === "out") {
      if (!selectedProduct) {
        setQuantityLimitMessage("");
        updateForm({ quantity: 0 });
        return;
      }

      if (parsedQuantity > selectedProductWarehouseStock) {
        setQuantityLimitMessage(
          describeWarehouseLimit(
            parsedQuantity,
            selectedProductWarehouseStock,
            effectiveWarehouseName,
          ),
        );
        updateForm({ quantity: selectedProductWarehouseStock });
        return;
      }

      setQuantityLimitMessage("");
      updateForm({ quantity: parsedQuantity });
      return;
    }

    setQuantityLimitMessage("");
    updateForm({ quantity: parsedQuantity });
  }

  function setQuantityFromControl(nextQuantity: number) {
    updateQuantity(String(Math.max(Math.trunc(nextQuantity), 0)));
  }

  function decreaseQuantity() {
    setQuantityFromControl(form.quantity - 1);
  }

  function increaseQuantity() {
    setQuantityFromControl(form.quantity + 1);
  }

  function useAvailableStockAsQuantity() {
    if (mode !== "out" || !selectedProduct) {
      return;
    }

    setQuantityLimitMessage("");
    updateForm({ quantity: selectedProductWarehouseStock });
  }

  const effectiveReasonType = mode === "in" ? "OTHER" : form.reasonType;
  const isExpirationReason = mode === "out" && effectiveReasonType === "EXPIRATION";
  const selectedProduct = products.find(
    (product) => product.id === form.productId,
  );
  const selectedProductWarehouseStock = selectedProduct
    ? getAvailableStockForSelection(selectedProduct.id, effectiveWarehouseId)
    : 0;
  const quantityDisabled = mode === "out" && !selectedProduct;
  const quantityExceedsStock =
    mode === "out" &&
    Boolean(selectedProduct) &&
    form.quantity > selectedProductWarehouseStock;
  const quantityDecreaseDisabled = quantityDisabled || form.quantity <= 0;
  const quantityIncreaseDisabled =
    quantityDisabled ||
    (mode === "out" &&
      Boolean(selectedProduct) &&
      form.quantity >= selectedProductWarehouseStock);
  const quantityMaxDisabled =
    mode !== "out" || !selectedProduct || selectedProductWarehouseStock <= 0;
  const quantityHelperText = quantityDisabled
    ? "Selecciona un producto para capturar la cantidad."
    : quantityLimitMessage
      ? quantityLimitMessage
      : mode === "out" && selectedProduct
        ? `Almacén: ${effectiveWarehouseName}. Stock disponible: ${selectedProductWarehouseStock}. No puedes retirar más unidades de este almacén.`
        : "Escribe la cantidad exacta. Solo se aceptan números enteros.";
  const expirationLossPreview = isExpirationReason
    ? Number(selectedProduct?.costPrice ?? 0) *
      Math.max(Number(form.quantity) || 0, 0)
    : 0;
  const normalizedWarehouseName = normalizeWarehouseInput(warehouseName);
  const canCreateWarehouse =
    normalizedWarehouseName.length >= 2 && !isCreatingWarehouse;
  const submitLabel = mode === "in" ? "Registrar entrada" : "Registrar salida";
  const title = mode === "in" ? "Registrar entrada" : "Registrar salida";
  const description =
    mode === "in"
      ? "Suma existencias por compra, reposición o ajuste autorizado."
      : "Descuenta existencias por caducidad, daño, merma o retiro autorizado.";
  const guidanceTitle = mode === "in" ? "Entrada al inventario" : "Salida del inventario";
  const guidanceDescription =
    mode === "in"
      ? "Confirma producto, almacén, cantidad y origen antes de aumentar stock."
      : "Confirma producto, almacén, cantidad y motivo antes de descontar stock.";

  return (
    <Card sx={{ mb: 2 }} data-testid={`inventory-${mode}-section`}>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Box
                sx={(theme) => ({
                  display: "grid",
                  placeItems: "center",
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  color:
                    mode === "in"
                      ? theme.palette.success.main
                      : theme.palette.warning.main,
                  bgcolor: alpha(
                    mode === "in"
                      ? theme.palette.success.main
                      : theme.palette.warning.main,
                    0.12,
                  ),
                })}
              >
                {mode === "in" ? <AddCircleIcon /> : <RemoveCircleIcon />}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={(theme) => ({
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                bgcolor: theme.palette.background.default,
                px: 1.5,
                py: 1,
                maxWidth: { xs: "100%", md: 340 },
              })}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                {guidanceTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {guidanceDescription}
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
                  onChange={(event) => updateProduct(event.target.value)}
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
                      updateWarehouse(warehouse?.id ?? "")
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
                        helperText="Busca una ubicación o crea una nueva. Si queda vacío, se usará Almacén: Principal."
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
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    value={form.quantity > 0 ? String(form.quantity) : ""}
                    disabled={quantityDisabled}
                    error={quantityExceedsStock}
                    helperText={quantityHelperText}
                    inputProps={{
                      "data-testid": "inventory-form-quantity",
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      ...(mode === "out" && selectedProduct
                        ? { max: selectedProductWarehouseStock }
                        : {}),
                    }}
                    onChange={(event) => updateQuantity(event.target.value)}
                  />

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      flexWrap: "wrap",
                      rowGap: 1,
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={quantityDecreaseDisabled}
                      onClick={decreaseQuantity}
                      data-testid="inventory-form-quantity-decrease"
                      aria-label="Disminuir cantidad"
                    >
                      -1
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={quantityIncreaseDisabled}
                      onClick={increaseQuantity}
                      data-testid="inventory-form-quantity-increase"
                      aria-label="Aumentar cantidad"
                    >
                      +1
                    </Button>
                    {mode === "out" && (
                      <Button
                        variant="text"
                        size="small"
                        disabled={quantityMaxDisabled}
                        onClick={useAvailableStockAsQuantity}
                        data-testid="inventory-form-quantity-max"
                      >
                        Usar disponible
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>

              {mode === "out" && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Motivo"
                    value={effectiveReasonType}
                    inputProps={{
                      "data-testid": "inventory-form-reason-type",
                    }}
                    onChange={(event) =>
                      updateForm({
                        reasonType: event.target
                          .value as InventoryMovementForm["reasonType"],
                        reason:
                          event.target.value === "EXPIRATION" ? "" : form.reason,
                      })
                    }
                    helperText="Caducidad se reporta como merma en dinero"
                  >
                    <MenuItem value="OTHER">{INVENTORY_REASON_TYPE_LABELS.OTHER}</MenuItem>
                    <MenuItem value="EXPIRATION">{INVENTORY_REASON_TYPE_LABELS.EXPIRATION}</MenuItem>
                  </TextField>
                </Grid>
              )}

              <Grid item xs={12} sm={mode === "out" ? 4 : 8}>
                <TextField
                  fullWidth
                  label={mode === "in" ? "Motivo de entrada" : "Detalle del motivo"}
                  value={isExpirationReason ? "Caducidad" : form.reason}
                  disabled={isExpirationReason}
                  helperText={
                    isExpirationReason
                      ? `Pérdida estimada: ${formatInventoryMoney(expirationLossPreview)}`
                      : mode === "in"
                        ? "Reabastecimiento queda por defecto. Puedes cambiarlo si aplica."
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
                    borderColor: isExpirationReason
                      ? "warning.main"
                      : mode === "in"
                        ? "success.main"
                        : "divider",
                    borderRadius: 3,
                    bgcolor: isExpirationReason
                      ? theme.palette.warning.main + "14"
                      : mode === "in"
                        ? theme.palette.success.main + "10"
                        : theme.palette.background.default,
                    px: 2,
                    py: 1.5,
                  })}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" fontWeight={900}>
                      {isExpirationReason
                        ? "Salida por caducidad"
                        : mode === "in"
                          ? "Entrada operativa"
                          : "Salida operativa"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isExpirationReason
                        ? `Se descontarán ${form.quantity || 0} unidades y se registrará una merma estimada de ${formatInventoryMoney(expirationLossPreview)}.`
                        : mode === "in"
                          ? "La entrada aumentará existencias en el almacén seleccionado."
                          : "La salida descontará existencias y quedará registrada con el motivo capturado."}
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
                    color={mode === "in" ? "success" : "warning"}
                    onClick={() => onSubmit(mode)}
                    disabled={isInvalid}
                    startIcon={mode === "in" ? <AddCircleIcon /> : <RemoveCircleIcon />}
                    data-testid={mode === "in" ? "inventory-submit-in" : "inventory-submit-out"}
                  >
                    {submitLabel}
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
