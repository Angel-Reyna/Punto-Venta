import { FormEvent } from "react";

import { Box, Button, Grid, MenuItem, TextField } from "@mui/material";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import {
  INITIAL_STOCK_INFO_TEXT,
  MIN_STOCK_INFO_TEXT,
  PRODUCT_CODE_INFO_TEXT,
  PROMO_INFO_TEXT,
  ProductCategory,
  ProductFormValues,
  SKU_INFO_TEXT,
  generateLocalProductCode,
  isInvalidNonNegativeInteger,
  isInvalidNonNegativeNumber,
  safeTrim,
  toNonNegativeNumber,
} from "./productShared";

type ProductFormDialogProps = {
  categories: ProductCategory[];
  form: ProductFormValues;
  isSubmitting: boolean;
  mode?: "create" | "edit";
  onClose: () => void;
  onFormChange: (form: ProductFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
};

export function ProductFormDialog({
  categories,
  form,
  isSubmitting,
  mode = "create",
  onClose,
  onFormChange,
  onSubmit,
  open,
}: ProductFormDialogProps) {
  const promoPercent = toNonNegativeNumber(form.promoPercent);
  const isEditMode = mode === "edit";

  const formIsInvalid =
    !safeTrim(form.sku) ||
    !safeTrim(form.name) ||
    isInvalidNonNegativeNumber(form.costPrice) ||
    isInvalidNonNegativeNumber(form.salePrice) ||
    isInvalidNonNegativeNumber(form.promoPercent) ||
    promoPercent > 100 ||
    (!isEditMode && isInvalidNonNegativeInteger(form.initialStock)) ||
    isInvalidNonNegativeInteger(form.minStock) ||
    isSubmitting;

  const productFormDisabledReason = (() => {
    if (!safeTrim(form.sku)) return "Captura una clave interna/SKU.";
    if (!safeTrim(form.name)) return "Captura el nombre del producto.";
    if (isInvalidNonNegativeNumber(form.costPrice)) {
      return "El costo debe ser un número mayor o igual a cero.";
    }
    if (isInvalidNonNegativeNumber(form.salePrice)) {
      return "El precio de venta debe ser un número mayor o igual a cero.";
    }
    if (isInvalidNonNegativeNumber(form.promoPercent) || promoPercent > 100) {
      return "La promoción debe estar entre 0 y 100%.";
    }
    if (!isEditMode && isInvalidNonNegativeInteger(form.initialStock)) {
      return "El stock inicial debe ser un entero mayor o igual a cero.";
    }
    if (isInvalidNonNegativeInteger(form.minStock)) {
      return "El stock mínimo debe ser un entero mayor o igual a cero.";
    }
    if (isSubmitting) {
      return isEditMode ? "Actualizando producto..." : "Guardando producto...";
    }

    return "";
  })();

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      disableClose={isSubmitting}
      maxWidth="md"
      title={isEditMode ? "Editar producto" : "Nuevo producto"}
      description={
        isEditMode
          ? "Actualiza datos comerciales, precios, promoción y nivel de alerta sin alterar el historial de ventas."
          : "Registra datos comerciales, precios e inventario inicial en una sola operación."
      }
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-create-form"
            disabled={formIsInvalid}
            data-testid="product-form-submit"
          >
            {isSubmitting
              ? isEditMode
                ? "Actualizando..."
                : "Guardando..."
              : isEditMode
                ? "Actualizar producto"
                : "Guardar producto"}
          </Button>
        </>
      }
    >
      <Box
        id="product-create-form"
        component="form"
        noValidate
        onSubmit={onSubmit}
        sx={{ pt: { xs: 0.75, sm: 1 } }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label={
                <LabelWithInfo
                  label="Clave interna/SKU"
                  info={SKU_INFO_TEXT}
                  ariaLabel={SKU_INFO_TEXT}
                />
              }
              value={form.sku}
              helperText="Identificador interno único. Ejemplo: COCA-600 o SAB-ACE-1KG."
              inputProps={{
                "data-testid": "product-form-sku",
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  sku: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ minHeight: 56 }}
              onClick={() => {
                const code = generateLocalProductCode();

                onFormChange({
                  ...form,
                  sku: form.sku || code,
                  barcode: code,
                });
              }}
            >
              Generar código
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={
                <LabelWithInfo
                  label="Código del producto"
                  info={PRODUCT_CODE_INFO_TEXT}
                  ariaLabel={PRODUCT_CODE_INFO_TEXT}
                />
              }
              value={form.barcode}
              helperText="Puede ser código de barras, código interno o código generado."
              inputProps={{
                "data-testid": "product-form-barcode",
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  barcode: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Categoría"
              value={form.categoryId}
              helperText="Selecciona una categoría activa."
              onChange={(event) =>
                onFormChange({
                  ...form,
                  categoryId: event.target.value,
                })
              }
            >
              <MenuItem value="">Sin categoría</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del producto"
              value={form.name}
              inputProps={{
                "data-testid": "product-form-name",
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  name: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Descripción opcional"
              value={form.description}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  description: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Costo unitario"
              type="number"
              value={form.costPrice}
              inputProps={{
                "data-testid": "product-form-cost-price",
                min: 0,
                step: 0.01,
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  costPrice: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Precio de venta"
              type="number"
              value={form.salePrice}
              inputProps={{
                "data-testid": "product-form-sale-price",
                min: 0,
                step: 0.01,
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  salePrice: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={
                <LabelWithInfo
                  label="Promoción (%)"
                  info={PROMO_INFO_TEXT}
                  ariaLabel={PROMO_INFO_TEXT}
                />
              }
              type="number"
              value={form.promoPercent}
              inputProps={{
                min: 0,
                max: 100,
                step: 0.01,
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  promoPercent: event.target.value,
                })
              }
            />
          </Grid>

          {!isEditMode && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={
                  <LabelWithInfo
                    label="Stock inicial"
                    info={INITIAL_STOCK_INFO_TEXT}
                    ariaLabel={INITIAL_STOCK_INFO_TEXT}
                  />
                }
                type="number"
                value={form.initialStock}
                helperText="Crea inventario real en el almacén principal."
                inputProps={{
                  "data-testid": "product-form-initial-stock",
                  min: 0,
                  step: 1,
                }}
                onChange={(event) =>
                  onFormChange({
                    ...form,
                    initialStock: event.target.value,
                  })
                }
              />
            </Grid>
          )}

          <Grid item xs={12} md={isEditMode ? 8 : 4}>
            <TextField
              fullWidth
              label={
                <LabelWithInfo
                  label="Stock mínimo"
                  info={MIN_STOCK_INFO_TEXT}
                  ariaLabel={MIN_STOCK_INFO_TEXT}
                />
              }
              type="number"
              value={form.minStock}
              inputProps={{
                "data-testid": "product-form-min-stock",
                min: 0,
                step: 1,
              }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  minStock: event.target.value,
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <ActionDisabledReason message={formIsInvalid ? productFormDisabledReason : ""} />
          </Grid>
        </Grid>
      </Box>
    </ResponsiveDialog>
  );
}
