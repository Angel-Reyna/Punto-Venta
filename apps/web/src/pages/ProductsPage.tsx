import { FormEvent, useEffect, useMemo, useState } from "react";

import { Box, Button, Chip, Grid, MenuItem, TextField } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";

import { api } from "../api/client";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { LabelWithInfo } from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { ResponsiveDialog } from "../components/ResponsiveDialog";
import { SearchToolbar } from "../components/SearchToolbar";
import { StatusFeedback } from "../components/StatusFeedback";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
import { getApiErrorMessage } from "../utils/apiError";
import { downloadBlob } from "../utils/downloadBlob";
import {
  INITIAL_STOCK_INFO_TEXT,
  MIN_STOCK_INFO_TEXT,
  PRODUCT_CODE_INFO_TEXT,
  Product,
  ProductCatalog,
  ProductCategory,
  PROMO_INFO_TEXT,
  SKU_INFO_TEXT,
  generateLocalProductCode,
  initialForm,
  isInvalidNonNegativeInteger,
  isInvalidNonNegativeNumber,
  safeTrim,
  toNonNegativeNumber,
} from "./products/productShared";

export function ProductsPage() {
  const { can } = useAuth();
  const canCreateProduct = can(PERMISSIONS.ProductsCreate);
  const canImportProducts = can(PERMISSIONS.ProductsImport);
  const canToggleProducts = can(PERMISSIONS.ProductsToggleActive);
  const canDeleteProducts = can(PERMISSIONS.ProductsDelete);
  const canViewAdminColumns =
    canCreateProduct || canImportProducts || canToggleProducts || canDeleteProducts;

  const [rows, setRows] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(
    null,
  );
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);

  async function load(query = searchQuery) {
    try {
      setError("");

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get<Product[]>("/products", {
          params: {
            q: query.trim() || undefined,
            pageSize: 100,
          },
        }),
        canCreateProduct
          ? api.get<ProductCategory[]>("/products/categories")
          : Promise.resolve({ data: [] as ProductCategory[] }),
      ]);

      setRows(productsResponse.data);
      setCategories(categoriesResponse.data);
    } catch {
      setError("No se pudo cargar el catálogo de productos.");
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(searchQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [canCreateProduct, searchQuery]);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setIsCreatingProduct(true);

      await api.post("/products", {
        categoryId: safeTrim(form.categoryId) || undefined,
        sku: safeTrim(form.sku),
        barcode: safeTrim(form.barcode) || undefined,
        name: safeTrim(form.name),
        description: safeTrim(form.description) || undefined,
        costPrice: toNonNegativeNumber(form.costPrice),
        salePrice: toNonNegativeNumber(form.salePrice),
        promoPercent: toNonNegativeNumber(form.promoPercent),
        initialStock: toNonNegativeNumber(form.initialStock),
        minStock: toNonNegativeNumber(form.minStock),
      });

      setMessage("Producto creado correctamente.");
      setOpen(false);
      setForm(initialForm);

      await load();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo crear el producto. Revisa SKU, precios y campos obligatorios.",
        ),
      );
    } finally {
      setIsCreatingProduct(false);
    }
  }

  async function downloadTemplate() {
    setError("");
    setIsDownloadingTemplate(true);

    try {
      const response = await api.get("/products/template/excel", {
        responseType: "blob",
      });

      downloadBlob(response.data, "formato-productos.xlsx");
    } catch {
      setError("No se pudo descargar el formato Excel.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function importExcel(file?: File) {
    if (!file || isImportingExcel) return;

    setMessage("");
    setError("");
    setIsImportingExcel(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post("/products/import/excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(`Productos importados: ${response.data.imported}`);

      await load();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo importar el archivo Excel. Verifica que uses el formato correcto.",
        ),
      );
    } finally {
      setIsImportingExcel(false);
    }
  }

  async function toggleProduct(productId: string) {
    if (togglingProductId) return;

    setMessage("");
    setError("");
    setTogglingProductId(productId);

    try {
      await api.patch(`/products/${productId}/toggle`);

      setMessage("Estado del producto actualizado.");

      await load();
    } catch (err: any) {
      setError(getApiErrorMessage(err, "No se pudo actualizar el producto."));
    } finally {
      setTogglingProductId(null);
    }
  }

  async function deleteProduct() {
    if (!productPendingDelete || deletingProductId) return;

    setMessage("");
    setError("");
    setDeletingProductId(productPendingDelete.id);

    try {
      const response = await api.delete<{ message?: string }>(
        `/products/${productPendingDelete.id}`
      );

      setMessage(response.data.message ?? "Producto eliminado correctamente.");
      setProductPendingDelete(null);

      await load();
    } catch (err: any) {
      setError(getApiErrorMessage(err, "No se pudo eliminar el producto."));
    } finally {
      setDeletingProductId(null);
    }
  }

  const normalizedSearchQuery = searchQuery.trim();

  const productSearchHelper = useMemo(() => {
    if (!normalizedSearchQuery) {
      return "Busca por nombre, clave interna/SKU, código del producto, categoría o descripción.";
    }

    return `Mostrando coincidencias para “${normalizedSearchQuery}”.`;
  }, [normalizedSearchQuery]);

  const promoPercent = toNonNegativeNumber(form.promoPercent);

  const formIsInvalid =
    !safeTrim(form.sku) ||
    !safeTrim(form.name) ||
    isInvalidNonNegativeNumber(form.costPrice) ||
    isInvalidNonNegativeNumber(form.salePrice) ||
    isInvalidNonNegativeNumber(form.promoPercent) ||
    promoPercent > 100 ||
    isInvalidNonNegativeInteger(form.initialStock) ||
    isInvalidNonNegativeInteger(form.minStock) ||
    isCreatingProduct;

  const productFormDisabledReason = (() => {
    if (!safeTrim(form.sku)) return "Captura una clave interna/SKU.";
    if (!safeTrim(form.name)) return "Captura el nombre del producto.";
    if (isInvalidNonNegativeNumber(form.costPrice))
      return "El costo debe ser un número mayor o igual a cero.";
    if (isInvalidNonNegativeNumber(form.salePrice))
      return "El precio de venta debe ser un número mayor o igual a cero.";
    if (isInvalidNonNegativeNumber(form.promoPercent) || promoPercent > 100) {
      return "La promoción debe estar entre 0 y 100%.";
    }
    if (isInvalidNonNegativeInteger(form.initialStock))
      return "El stock inicial debe ser un entero mayor o igual a cero.";
    if (isInvalidNonNegativeInteger(form.minStock))
      return "El stock mínimo debe ser un entero mayor o igual a cero.";
    if (isCreatingProduct) return "Guardando producto...";

    return "";
  })();

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle={
          canViewAdminColumns
            ? "Gestiona catálogo, precios, promociones, stock mínimo e importación por Excel."
            : "Consulta productos activos, precios y stock disponible."
        }
        action={
          canCreateProduct && (
            <Button
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Nuevo producto
            </Button>
          )
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={canViewAdminColumns ? "primary" : "success"}
          label={
            canViewAdminColumns
              ? "Vista con permisos de gestión: productos completos"
              : "Vista de consulta: catálogo activo"
          }
        />
      </Box>

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

      <SearchToolbar
        label="Buscar productos"
        placeholder="Ej. COCA-600, refresco, 750..., bebidas"
        query={searchQuery}
        onQueryChange={setSearchQuery}
        resultCount={rows.length}
        helperText={productSearchHelper}
      />

      {canImportProducts && (
        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 1,
            mb: 2,
          }}
        >
          <Button
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
            disabled={isDownloadingTemplate || isImportingExcel}
          >
            {isDownloadingTemplate ? "Descargando..." : "Descargar formato"}
          </Button>

          <Button
            fullWidth
            component="label"
            startIcon={<UploadIcon />}
            disabled={isImportingExcel || isDownloadingTemplate}
          >
            {isImportingExcel ? "Importando..." : "Importar productos"}
            <input
              hidden
              type="file"
              accept=".xlsx"
              disabled={isImportingExcel}
              onChange={(event) => {
                void importExcel(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </Button>
        </Box>
      )}

      <ProductCatalog
        rows={rows}
        searchQuery={searchQuery}
        canViewAdminColumns={canViewAdminColumns}
        canToggleProducts={canToggleProducts}
        canDeleteProducts={canDeleteProducts}
        togglingProductId={togglingProductId}
        deletingProductId={deletingProductId}
        onToggleProduct={toggleProduct}
        onDeleteProduct={setProductPendingDelete}
      />

      {canDeleteProducts && (
        <ResponsiveDialog
          open={Boolean(productPendingDelete)}
          onClose={() => setProductPendingDelete(null)}
          disableClose={Boolean(deletingProductId)}
          maxWidth="sm"
          title="Eliminar producto"
          description="Si el producto no tiene historial se eliminará físicamente. Si ya tiene ventas, devoluciones o movimientos de inventario, se desactivará para conservar trazabilidad."
          actions={
            <>
              <Button
                variant="outlined"
                onClick={() => setProductPendingDelete(null)}
                disabled={Boolean(deletingProductId)}
              >
                Cancelar
              </Button>
              <Button
                color="error"
                onClick={deleteProduct}
                disabled={Boolean(deletingProductId)}
              >
                {deletingProductId ? "Eliminando..." : "Eliminar producto"}
              </Button>
            </>
          }
        >
          <Box sx={{ display: "grid", gap: 1 }}>
            <Chip
              color="warning"
              variant="outlined"
              label={productPendingDelete?.sku ?? "Producto seleccionado"}
              sx={{ justifySelf: "flex-start" }}
            />
            <Box component="p" sx={{ m: 0 }}>
              ¿Quieres eliminar o desactivar “{productPendingDelete?.name}”?
            </Box>
          </Box>
        </ResponsiveDialog>
      )}

      {canCreateProduct && (
        <ResponsiveDialog
          open={open}
          onClose={() => setOpen(false)}
          disableClose={isCreatingProduct}
          maxWidth="md"
          title="Nuevo producto"
          description="Registra datos comerciales, precios e inventario inicial en una sola operación."
          actions={
            <>
              <Button
                variant="outlined"
                onClick={() => setOpen(false)}
                disabled={isCreatingProduct}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="product-create-form"
                disabled={formIsInvalid}
              >
                {isCreatingProduct ? "Guardando..." : "Guardar producto"}
              </Button>
            </>
          }
        >
          <Box
            id="product-create-form"
            component="form"
            noValidate
            onSubmit={submit}
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
                  onChange={(event) =>
                    setForm({
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

                    setForm((currentForm) => ({
                      ...currentForm,
                      sku: currentForm.sku || code,
                      barcode: code,
                    }));
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
                  onChange={(event) =>
                    setForm({
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
                    setForm({
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
                  onChange={(event) =>
                    setForm({
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
                    setForm({
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
                    min: 0,
                    step: 0.01,
                  }}
                  onChange={(event) =>
                    setForm({
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
                    min: 0,
                    step: 0.01,
                  }}
                  onChange={(event) =>
                    setForm({
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
                    setForm({
                      ...form,
                      promoPercent: event.target.value,
                    })
                  }
                />
              </Grid>

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
                    min: 0,
                    step: 1,
                  }}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      initialStock: event.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
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
                    min: 0,
                    step: 1,
                  }}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      minStock: event.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <ActionDisabledReason
                  message={formIsInvalid ? productFormDisabledReason : ""}
                />
              </Grid>
            </Grid>
          </Box>
        </ResponsiveDialog>
      )}
    </>
  );
}
