import { FormEvent, useMemo, useState } from "react";

import {
  Box,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import CategoryIcon from "@mui/icons-material/Category";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
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
  OTHER_CATEGORY_VALUE,
  Product,
  ProductFormValues,
  formatCurrency,
  generateLocalProductCode,
  initialForm,
  safeTrim,
  toNonNegativeNumber,
} from "./productShared";
import { ProductCatalog } from "./ProductCatalog";
import {
  type ProductFilterOption,
  type ProductSortOption,
} from "./ProductCatalogToolbar";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductImportActions } from "./ProductImportActions";
import { useProductsData } from "./useProductsData";

function numberToFormValue(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? String(numberValue) : "0";
}

function productToForm(product: Product): ProductFormValues {
  return {
    barcode: product.barcode ?? "",
    categoryId: product.category?.id ?? "",
    categoryName: "",
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

function matchesProductFilter(product: Product, filter: ProductFilterOption) {
  const isActive = product.isActive !== false;
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);
  const promoPercent = Number(product.promoPercent ?? 0);

  switch (filter) {
    case "Activos":
      return isActive;
    case "Inactivos":
      return !isActive;
    case "Bajo stock":
      return isActive && minStock > 0 && stock > 0 && stock <= minStock;
    case "Sin stock":
      return isActive && stock <= 0;
    case "Con promoción":
      return isActive && promoPercent > 0;
    case "Todos":
    default:
      return true;
  }
}

function sortProducts(products: Product[], sort: ProductSortOption) {
  return [...products].sort((firstProduct, secondProduct) => {
    switch (sort) {
      case "stock-asc":
        return (
          Number(firstProduct.stock ?? 0) - Number(secondProduct.stock ?? 0)
        );
      case "stock-desc":
        return (
          Number(secondProduct.stock ?? 0) - Number(firstProduct.stock ?? 0)
        );
      case "price-asc":
        return (
          Number(firstProduct.finalPrice ?? 0) -
          Number(secondProduct.finalPrice ?? 0)
        );
      case "price-desc":
        return (
          Number(secondProduct.finalPrice ?? 0) -
          Number(firstProduct.finalPrice ?? 0)
        );
      case "name-asc":
      default:
        return firstProduct.name.localeCompare(secondProduct.name, "es", {
          sensitivity: "base",
        });
    }
  });
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues>(initialForm);
  const [productFilter, setProductFilter] =
    useState<ProductFilterOption>("Todos");
  const [productSort, setProductSort] = useState<ProductSortOption>("name-asc");

  const {
    categories,
    createProduct,
    deleteAllProducts,
    deletingProductId,
    deleteSelectedProduct,
    downloadTemplate,
    error,
    importExcel,
    isCreatingProduct,
    isDeletingAllProducts,
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
  } = useProductsData({
    canCreateProduct: canCreateProduct || canUpdateProducts,
  });

  function closeBulkDeleteDialog() {
    if (isDeletingAllProducts) return;

    setBulkDeleteOpen(false);
    setBulkDeleteConfirmation("");
  }

  async function confirmDeleteAllProducts() {
    if (bulkDeleteConfirmation !== "ELIMINAR TODO") return;

    const productsWereDeleted = await deleteAllProducts();

    if (!productsWereDeleted) return;

    setBulkDeleteOpen(false);
    setBulkDeleteConfirmation("");
  }

  function closeProductForm() {
    if (isCreatingProduct || updatingProductId) return;

    setOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  function openCreateProductForm() {
    const generatedCode = generateLocalProductCode();

    setEditingProduct(null);
    setForm({
      ...initialForm,
      barcode: generatedCode,
      sku: generatedCode,
    });
    setOpen(true);
  }

  function openEditProductForm(product: Product) {
    setEditingProduct(product);
    setForm(productToForm(product));
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const customCategoryName = safeTrim(form.categoryName);
    const selectedCategoryId = safeTrim(form.categoryId);
    const usesCustomCategory = selectedCategoryId === OTHER_CATEGORY_VALUE;
    const categoryPayload = usesCustomCategory
      ? {
          categoryId: null,
          categoryName: customCategoryName || null,
        }
      : {
          categoryId: selectedCategoryId || null,
          categoryName: null,
        };

    const payload = {
      ...categoryPayload,
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
          categoryName: payload.categoryName || undefined,
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

  const catalogRows = useMemo(() => {
    const filteredRows = rows.filter((product) =>
      matchesProductFilter(product, productFilter),
    );

    return sortProducts(filteredRows, productSort);
  }, [productFilter, productSort, rows]);

  const productStats = useMemo(() => {
    const activeProducts = rows.filter(
      (product) => product.isActive !== false,
    ).length;
    const inactiveProducts = rows.length - activeProducts;
    const activeRows = rows.filter((product) => product.isActive !== false);
    const lowStockProducts = activeRows.filter((product) => {
      const stock = Number(product.stock ?? 0);
      const minStock = Number(product.minStock ?? 0);

      return minStock > 0 && stock > 0 && stock <= minStock;
    }).length;
    const outOfStockProducts = activeRows.filter(
      (product) => Number(product.stock ?? 0) <= 0,
    ).length;
    const promotedProducts = activeRows.filter(
      (product) => Number(product.promoPercent ?? 0) > 0,
    ).length;
    const categoryCount = new Set(
      rows.map((product) => product.category?.name).filter(Boolean),
    ).size;
    const inventoryValue = activeRows.reduce((total, product) => {
      const stock = Math.max(0, Number(product.stock ?? 0));
      const costPrice = Math.max(0, Number(product.costPrice ?? 0));

      return total + stock * costPrice;
    }, 0);

    return {
      activeProducts,
      inventoryValue,
      categoryCount,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      promotedProducts,
      totalProducts: rows.length,
    };
  }, [rows]);

  const productSearchHelper = useMemo(() => {
    if (!normalizedSearchQuery && productFilter === "Todos") {
      return "Busca por nombre, clave interna/SKU, código del producto, categoría o descripción.";
    }

    if (normalizedSearchQuery && productFilter !== "Todos") {
      return `Mostrando “${normalizedSearchQuery}” dentro de ${productFilter.toLowerCase()}.`;
    }

    if (normalizedSearchQuery) {
      return `Mostrando coincidencias para “${normalizedSearchQuery}”.`;
    }

    return `Mostrando productos en filtro ${productFilter.toLowerCase()}.`;
  }, [normalizedSearchQuery, productFilter]);

  return (
    <>
      <Card
        data-testid="products-visual-dashboard"
        sx={(theme) => ({
          mb: 2.5,
          overflow: "hidden",
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.18),
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.12,
          )}, ${alpha(theme.palette.background.paper, 0.96)} 48%, ${alpha(
            theme.palette.success.main,
            0.08,
          )})`,
        })}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.4 } }}>
          <Stack spacing={2.25}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2.2}
              alignItems={{ xs: "stretch", lg: "flex-start" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.35} sx={{ minWidth: 0 }}>
                <Box
                  aria-hidden="true"
                  sx={(theme) => ({
                    background: `radial-gradient(circle at 30% 20%, ${alpha(
                      theme.palette.primary.main,
                      0.28,
                    )}, ${alpha(theme.palette.primary.main, 0.08)} 68%)`,
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.28),
                    borderRadius: 3.25,
                    color: "primary.main",
                    display: "grid",
                    flex: "0 0 56px",
                    height: 56,
                    placeItems: "center",
                    width: 56,
                  })}
                >
                  <StorefrontIcon sx={{ fontSize: 31 }} />
                </Box>

                <Box sx={{ minWidth: 0, maxWidth: 820 }}>
                  <Typography
                    color="primary.main"
                    fontWeight={850}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    variant="caption"
                  >
                    Productos
                  </Typography>
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={950}
                    letterSpacing="-0.04em"
                    sx={{ mt: 0.1 }}
                  >
                    Catálogo de productos
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.45, maxWidth: 780 }}
                    variant="body2"
                  >
                    {canViewAdminColumns
                      ? "Administra productos, códigos, categorías, precios, promociones, estados y alertas de stock sin saturar la pantalla."
                      : "Consulta productos activos, precios finales y disponibilidad antes de vender."}
                  </Typography>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    gap={0.85}
                    sx={{ mt: 1.2 }}
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Códigos y SKU"
                      sx={{ fontWeight: 850 }}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Precios y margen"
                      sx={{ fontWeight: 850 }}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Stock mínimo"
                      sx={{ fontWeight: 850 }}
                    />
                  </Stack>
                </Box>
              </Stack>

              {(canCreateProduct || canImportProducts || canDeleteProducts) && (
                <Stack
                  alignItems={{ xs: "stretch", sm: "center", lg: "flex-end" }}
                  direction={{ xs: "column", sm: "row", lg: "column" }}
                  spacing={1}
                  sx={{ alignSelf: { xs: "stretch", lg: "flex-start" } }}
                >
                  {canCreateProduct && (
                    <Button
                      size="large"
                      variant="contained"
                      startIcon={<AddCircleIcon />}
                      onClick={openCreateProductForm}
                      data-testid="products-create-button"
                    >
                      Nuevo producto
                    </Button>
                  )}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    flexWrap={{ sm: "wrap" }}
                    gap={1}
                    justifyContent={{ xs: "flex-start", lg: "flex-end" }}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    {canImportProducts && (
                      <ProductImportActions
                        isDownloadingTemplate={isDownloadingTemplate}
                        isImportingExcel={isImportingExcel}
                        onDownloadTemplate={downloadTemplate}
                        onImportExcel={importExcel}
                      />
                    )}
                    {canDeleteProducts && (
                      <Button
                        color="error"
                        size="large"
                        startIcon={<DeleteSweepIcon />}
                        variant="outlined"
                        onClick={() => setBulkDeleteOpen(true)}
                        data-testid="products-delete-all-button"
                      >
                        Eliminar catálogo
                      </Button>
                    )}
                  </Stack>
                </Stack>
              )}
            </Stack>

            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6} lg={3}>
                <VisualMetricCard
                  tone="primary"
                  icon={<Inventory2Icon />}
                  label="Valor de inventario"
                  value={formatCurrency(productStats.inventoryValue)}
                  helper="Costo estimado del stock activo"
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
                  label="Requieren atención"
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
                  label="Categorías"
                  value={productStats.categoryCount}
                  helper="Categorías reales asignadas al catálogo"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <VisualMetricCard
                  tone={productStats.promotedProducts ? "success" : "info"}
                  icon={<LocalOfferIcon />}
                  label="Promociones"
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

      <ProductCatalog
        rows={catalogRows}
        searchQuery={searchQuery}
        selectedFilter={productFilter}
        selectedSort={productSort}
        productSearchHelper={productSearchHelper}
        resultCount={catalogRows.length}
        totalCount={rows.length}
        canViewAdminColumns={canViewAdminColumns}
        canToggleProducts={canToggleProducts}
        canUpdateProducts={canUpdateProducts}
        canDeleteProducts={canDeleteProducts}
        togglingProductId={togglingProductId}
        deletingProductId={deletingProductId}
        onSearchQueryChange={setSearchQuery}
        onFilterChange={setProductFilter}
        onSortChange={setProductSort}
        onToggleProduct={toggleProduct}
        onEditProduct={openEditProductForm}
        onDeleteProduct={setProductPendingDelete}
      />

      {canDeleteProducts && (
        <ResponsiveDialog
          open={bulkDeleteOpen}
          onClose={closeBulkDeleteDialog}
          disableClose={isDeletingAllProducts}
          maxWidth="sm"
          title="Eliminar catálogo completo"
          description={`Esta acción elimina todo el catálogo actual, no solo los ${rows.length} producto${
            rows.length === 1 ? "" : "s"
          } visibles en esta pantalla. Las ventas, devoluciones y movimientos anteriores conservarán nombre y SKU como evidencia histórica.`}
          actions={
            <>
              <Button
                variant="outlined"
                onClick={closeBulkDeleteDialog}
                disabled={isDeletingAllProducts}
              >
                Cancelar
              </Button>
              <Button
                color="error"
                onClick={confirmDeleteAllProducts}
                disabled={
                  isDeletingAllProducts ||
                  bulkDeleteConfirmation !== "ELIMINAR TODO"
                }
                data-testid="products-delete-all-confirm-button"
              >
                {isDeletingAllProducts ? "Eliminando..." : "Eliminar catálogo"}
              </Button>
            </>
          }
        >
          <Stack spacing={2}>
            <Alert severity="warning">
              Se eliminarán todos los productos del catálogo, no solo los
              visibles con el filtro actual. Esta acción no debe usarse para
              ocultar productos temporalmente; para eso usa desactivar.
            </Alert>
            <Box>
              <Typography fontWeight={900}>
                Escribe ELIMINAR TODO para confirmar.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                El historial operativo se conserva mediante snapshots de nombre
                y SKU en ventas, devoluciones y movimientos de inventario. Esta
                acción no se puede deshacer desde la aplicación.
              </Typography>
            </Box>
            <TextField
              autoComplete="off"
              label="Confirmación"
              value={bulkDeleteConfirmation}
              onChange={(event) =>
                setBulkDeleteConfirmation(event.target.value)
              }
              placeholder="ELIMINAR TODO"
              fullWidth
              inputProps={{ "data-testid": "products-delete-all-confirm-text" }}
            />
          </Stack>
        </ResponsiveDialog>
      )}

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
