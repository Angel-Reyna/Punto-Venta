import { FormEvent, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import { StatusFeedback } from "../../components/StatusFeedback";
import { VisualMetricCard } from "../../components/VisualMetricCard";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import {
  Product,
  ProductFormValues,
  initialForm,
  safeTrim,
  toNonNegativeNumber,
} from "./productShared";
import { ProductCatalog } from "./ProductCatalog";
import { ProductCatalogToolbar } from "./ProductCatalogToolbar";
import { ProductFormDialog } from "./ProductFormDialog";
import { useProductsData } from "./useProductsData";

function numberToFormValue(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? String(numberValue) : "0";
}

function productToForm(product: Product): ProductFormValues {
  return {
    barcode: product.barcode ?? "",
    categoryId: product.category?.id ?? "",
    costPrice: numberToFormValue(product.costPrice),
    description: product.description ?? "",
    initialStock: "0",
    minStock: numberToFormValue(product.minStock),
    name: product.name,
    promoPercent: numberToFormValue(product.promoPercent),
    salePrice: numberToFormValue(product.salePrice),
    sku: product.sku,
  };
}

export function ProductsPage() {
  const { can } = useAuth();
  const canCreateProduct = can(PERMISSIONS.ProductsCreate);
  const canImportProducts = can(PERMISSIONS.ProductsImport);
  const canUpdateProducts = can(PERMISSIONS.ProductsUpdate);
  const canToggleProducts = can(PERMISSIONS.ProductsToggleActive);
  const canDeleteProducts = can(PERMISSIONS.ProductsDelete);
  const canViewAdminColumns =
    canCreateProduct ||
    canImportProducts ||
    canUpdateProducts ||
    canToggleProducts ||
    canDeleteProducts;

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues>(initialForm);

  const {
    categories,
    createProduct,
    deletingProductId,
    deleteSelectedProduct,
    downloadTemplate,
    error,
    importExcel,
    isCreatingProduct,
    isDownloadingTemplate,
    isImportingExcel,
    message,
    productPendingDelete,
    rows,
    searchQuery,
    setError,
    setMessage,
    setProductPendingDelete,
    setSearchQuery,
    togglingProductId,
    toggleProduct,
    updatingProductId,
    updateProduct,
  } = useProductsData({ canCreateProduct: canCreateProduct || canUpdateProducts });

  function closeProductForm() {
    if (isCreatingProduct || updatingProductId) return;

    setOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  function openCreateProductForm() {
    setEditingProduct(null);
    setForm(initialForm);
    setOpen(true);
  }

  function openEditProductForm(product: Product) {
    setEditingProduct(product);
    setForm(productToForm(product));
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const payload = {
      categoryId: safeTrim(form.categoryId) || null,
      sku: safeTrim(form.sku),
      barcode: safeTrim(form.barcode) || null,
      name: safeTrim(form.name),
      description: safeTrim(form.description) || null,
      costPrice: toNonNegativeNumber(form.costPrice),
      salePrice: toNonNegativeNumber(form.salePrice),
      promoPercent: toNonNegativeNumber(form.promoPercent),
      minStock: toNonNegativeNumber(form.minStock),
    };

    const productWasSaved = editingProduct
      ? await updateProduct(editingProduct.id, payload)
      : await createProduct({
          ...payload,
          categoryId: payload.categoryId || undefined,
          barcode: payload.barcode || undefined,
          description: payload.description || undefined,
          initialStock: toNonNegativeNumber(form.initialStock),
        });

    if (!productWasSaved) return;

    setOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  const normalizedSearchQuery = searchQuery.trim();

  const productStats = useMemo(() => {
    const activeProducts = rows.filter(
      (product) => product.isActive !== false,
    ).length;
    const inactiveProducts = rows.length - activeProducts;
    const lowStockProducts = rows.filter((product) => {
      const stock = Number(product.stock ?? 0);
      const minStock = Number(product.minStock ?? 0);

      return minStock > 0 && stock > 0 && stock <= minStock;
    }).length;
    const outOfStockProducts = rows.filter(
      (product) => Number(product.stock ?? 0) <= 0,
    ).length;
    const promotedProducts = rows.filter(
      (product) => Number(product.promoPercent ?? 0) > 0,
    ).length;
    const categoryCount = new Set(
      rows.map((product) => product.category?.name).filter(Boolean),
    ).size;

    return {
      activeProducts,
      categoryCount,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      promotedProducts,
      totalProducts: rows.length,
    };
  }, [rows]);

  const productSearchHelper = useMemo(() => {
    if (!normalizedSearchQuery) {
      return "Busca por nombre, clave interna/SKU, código del producto, categoría o descripción.";
    }

    return `Mostrando coincidencias para “${normalizedSearchQuery}”.`;
  }, [normalizedSearchQuery]);

  return (
    <>
      <Card
        data-testid="products-visual-dashboard"
        sx={(theme) => ({
          mb: 2.5,
          overflow: "hidden",
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.18),
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.12,
          )}, ${alpha(theme.palette.background.paper, 0.96)} 46%, ${alpha(
            theme.palette.success.main,
            0.08,
          )})`,
        })}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "flex-start" }}
              justifyContent="space-between"
            >
              <Stack spacing={1} sx={{ maxWidth: 760 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  alignItems="center"
                >
                  <Chip
                    icon={<StorefrontIcon />}
                    color={canViewAdminColumns ? "primary" : "success"}
                    label={
                      canViewAdminColumns
                        ? "Gestión de catálogo"
                        : "Catálogo disponible"
                    }
                  />
                  <Chip
                    variant="outlined"
                    label={`${productStats.totalProducts} producto${
                      productStats.totalProducts === 1 ? "" : "s"
                    } visibles`}
                  />
                </Stack>

                <Box>
                  <Typography variant="h4" component="h1" fontWeight={900}>
                    Productos
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {canViewAdminColumns
                      ? "Controla catálogo, precios, promociones, stock mínimo e importación por Excel desde una vista operativa."
                      : "Consulta productos activos, precios finales y disponibilidad antes de vender."}
                  </Typography>
                </Box>
              </Stack>

              {canCreateProduct && (
                <Button
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={openCreateProductForm}
                  data-testid="products-create-button"
                  sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
                >
                  Nuevo producto
                </Button>
              )}
            </Stack>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} lg={3}>
                <VisualMetricCard
                  tone="primary"
                  icon={<Inventory2Icon />}
                  label="Productos visibles"
                  value={productStats.totalProducts}
                  helper={`${productStats.activeProducts} activos${
                    productStats.inactiveProducts
                      ? ` · ${productStats.inactiveProducts} inactivos`
                      : ""
                  }`}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <VisualMetricCard
                  tone={
                    productStats.lowStockProducts ||
                    productStats.outOfStockProducts
                      ? "warning"
                      : "success"
                  }
                  icon={<WarningAmberIcon />}
                  label="Atención de stock"
                  value={
                    productStats.lowStockProducts +
                    productStats.outOfStockProducts
                  }
                  helper={`${productStats.lowStockProducts} bajos · ${productStats.outOfStockProducts} sin stock`}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <VisualMetricCard
                  tone="info"
                  icon={<CategoryIcon />}
                  label="Categorías visibles"
                  value={productStats.categoryCount}
                  helper="Agrupación detectada en los resultados actuales"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <VisualMetricCard
                  tone={productStats.promotedProducts ? "success" : "info"}
                  icon={<LocalOfferIcon />}
                  label="Con promoción"
                  value={productStats.promotedProducts}
                  helper="Productos con descuento aplicado"
                />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

      <ProductCatalogToolbar
        canImportProducts={canImportProducts}
        isDownloadingTemplate={isDownloadingTemplate}
        isImportingExcel={isImportingExcel}
        onDownloadTemplate={downloadTemplate}
        onImportExcel={importExcel}
        onSearchQueryChange={setSearchQuery}
        productSearchHelper={productSearchHelper}
        resultCount={rows.length}
        searchQuery={searchQuery}
      />

      <ProductCatalog
        rows={rows}
        searchQuery={searchQuery}
        canViewAdminColumns={canViewAdminColumns}
        canToggleProducts={canToggleProducts}
        canUpdateProducts={canUpdateProducts}
        canDeleteProducts={canDeleteProducts}
        togglingProductId={togglingProductId}
        deletingProductId={deletingProductId}
        onToggleProduct={toggleProduct}
        onEditProduct={openEditProductForm}
        onDeleteProduct={setProductPendingDelete}
      />

      {canDeleteProducts && (
        <ResponsiveDialog
          open={Boolean(productPendingDelete)}
          onClose={() => setProductPendingDelete(null)}
          disableClose={Boolean(deletingProductId)}
          maxWidth="sm"
          title="Eliminar producto"
          description="El producto se eliminará del catálogo. Las ventas, devoluciones y movimientos anteriores conservarán el nombre y SKU como evidencia histórica."
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
                onClick={deleteSelectedProduct}
                disabled={Boolean(deletingProductId)}
                data-testid="products-delete-confirm-button"
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
              ¿Quieres eliminar definitivamente “{productPendingDelete?.name}”
              del catálogo?
            </Box>
          </Box>
        </ResponsiveDialog>
      )}

      {(canCreateProduct || canUpdateProducts) && (
        <ProductFormDialog
          categories={categories}
          form={form}
          isSubmitting={Boolean(isCreatingProduct || updatingProductId)}
          mode={editingProduct ? "edit" : "create"}
          onClose={closeProductForm}
          onFormChange={setForm}
          onSubmit={submit}
          open={open}
        />
      )}
    </>
  );
}
