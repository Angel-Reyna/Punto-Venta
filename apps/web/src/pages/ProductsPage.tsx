import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { api } from "../api/client";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { InfoTooltip, LabelWithInfo } from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { ResponsiveDialog } from "../components/ResponsiveDialog";
import { SearchToolbar } from "../components/SearchToolbar";
import { StatusFeedback } from "../components/StatusFeedback";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
import { getApiErrorMessage } from "../utils/apiError";
import { downloadBlob } from "../utils/downloadBlob";

type Product = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;

  category?: {
    id: string;
    name: string;
  } | null;

  salePrice: number;
  promoPercent: number;
  finalPrice: number;
  stock: number;

  costPrice?: number;
  marginPercent?: number;
  minStock?: number;
  isActive?: boolean;
};

type ProductCategory = {
  id: string;
  name: string;
};

const SKU_INFO_TEXT =
  "SKU es la clave única de inventario del producto; significa Stock Keeping Unit, es decir, una unidad para identificar y controlar existencias.";
const PRODUCT_CODE_INFO_TEXT =
  "Código físico o comercial del producto. Puede ser código de barras, código del proveedor o un código generado por el sistema.";
const PROMO_INFO_TEXT =
  "Descuento porcentual aplicado sobre el precio de venta antes de calcular el precio final.";
const FINAL_PRICE_INFO_TEXT =
  "Precio que pagará el cliente después de aplicar la promoción configurada.";
const MARGIN_INFO_TEXT =
  "Porcentaje de ganancia estimado entre el costo unitario y el precio de venta.";
const INITIAL_STOCK_INFO_TEXT =
  "Cantidad disponible al crear el producto. Se registra como inventario real en el almacén principal.";
const MIN_STOCK_INFO_TEXT =
  "Nivel de alerta: cuando el stock llega a este número o queda por debajo, el producto aparece como bajo inventario.";

const initialForm = {
  categoryId: "",
  sku: "",
  barcode: "",
  name: "",
  description: "",
  costPrice: "",
  salePrice: "",
  promoPercent: "",
  initialStock: "",
  minStock: "",
};

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNonNegativeNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return 0;

  return Number(trimmed);
}

function isInvalidNonNegativeNumber(value: string) {
  const numberValue = toNonNegativeNumber(value);

  return !Number.isFinite(numberValue) || numberValue < 0;
}

function isInvalidNonNegativeInteger(value: string) {
  const numberValue = toNonNegativeNumber(value);

  return !Number.isInteger(numberValue) || numberValue < 0;
}

function generateLocalProductCode() {
  const bytes = new Uint32Array(1);

  globalThis.crypto?.getRandomValues(bytes);

  const randomPart = (bytes[0] || Math.floor(Math.random() * 1_000_000))
    .toString(36)
    .toUpperCase()
    .padStart(6, "0")
    .slice(0, 6);
  const timePart = Date.now().toString(36).toUpperCase().slice(-6);

  return `PV-${timePart}-${randomPart}`;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

function formatCurrency(value: unknown) {
  return currencyFormatter.format(Number(value ?? 0));
}

function formatPercent(value: unknown) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function getStockChip(product: Product) {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);

  if (stock <= 0) {
    return {
      color: "error" as const,
      label: "Sin stock",
    };
  }

  if (minStock > 0 && stock <= minStock) {
    return {
      color: "warning" as const,
      label: "Bajo inventario",
    };
  }

  return {
    color: "success" as const,
    label: "Disponible",
  };
}

type ProductFieldProps = {
  label: string;
  value: ReactNode;
  info?: ReactNode;
  emphasize?: boolean;
};

function ProductField({
  label,
  value,
  info,
  emphasize = false,
}: ProductFieldProps) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: 0.2, lineHeight: 1.3 }}
        >
          {label}
        </Typography>
        {info && (
          <InfoTooltip
            title={info}
            ariaLabel={typeof info === "string" ? info : undefined}
          />
        )}
      </Stack>

      <Typography
        variant="body2"
        sx={{
          fontWeight: emphasize ? 800 : 600,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {value === null || value === undefined || value === "" ? "N/A" : value}
      </Typography>
    </Stack>
  );
}

type ProductCatalogProps = {
  canToggleProducts: boolean;
  canViewAdminColumns: boolean;
  onToggleProduct: (productId: string) => void;
  rows: Product[];
  searchQuery: string;
  togglingProductId: string | null;
};

function ProductCatalog({
  canToggleProducts,
  canViewAdminColumns,
  onToggleProduct,
  rows,
  searchQuery,
  togglingProductId,
}: ProductCatalogProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack
            spacing={1}
            alignItems="center"
            sx={{ py: 4, textAlign: "center" }}
          >
            <Typography variant="h6" fontWeight={800}>
              {searchQuery.trim()
                ? "No hay productos que coincidan con la búsqueda"
                : "No hay productos registrados"}
            </Typography>
            <Typography color="text.secondary">
              {searchQuery.trim()
                ? "Intenta buscar por nombre, clave interna/SKU, código, categoría o descripción."
                : "Crea un producto o importa un archivo Excel para iniciar tu catálogo."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Catálogo de productos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista compacta y responsive; cada fila agrupa identidad, precios
                e inventario sin depender de desplazamiento horizontal.
              </Typography>
            </Box>

            <Chip
              color="primary"
              variant="outlined"
              label={`${rows.length} producto${rows.length === 1 ? "" : "s"}`}
            />
          </Stack>
        </Box>

        <Stack divider={<Divider flexItem />}>
          {rows.map((product) => {
            const stockChip = getStockChip(product);
            const hasPromo = Number(product.promoPercent ?? 0) > 0;
            const isToggleInProgress = togglingProductId === product.id;

            return (
              <Box
                key={product.id}
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: canToggleProducts
                      ? "minmax(0, 1.6fr) minmax(190px, 0.85fr) minmax(190px, 0.85fr) auto"
                      : "minmax(0, 1.6fr) minmax(190px, 0.85fr) minmax(190px, 0.85fr)",
                  },
                  px: 2.5,
                  py: 2.25,
                  transition: "background-color 120ms ease",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Stack spacing={1.25} sx={{ minWidth: 0 }}>
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={900}
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {product.name}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      alignItems="center"
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        label={product.category?.name ?? "Sin categoría"}
                      />
                      {canViewAdminColumns && (
                        <Chip
                          size="small"
                          color={product.isActive ? "success" : "default"}
                          label={product.isActive ? "Activo" : "Inactivo"}
                        />
                      )}
                    </Stack>
                  </Stack>

                  {product.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {product.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.25,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                      },
                    }}
                  >
                    <ProductField
                      label="Clave interna/SKU"
                      value={product.sku}
                      info={SKU_INFO_TEXT}
                    />
                    <ProductField
                      label="Código del producto"
                      value={product.barcode || "N/A"}
                      info={PRODUCT_CODE_INFO_TEXT}
                    />
                  </Box>
                </Stack>

                <Stack spacing={1.25}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 900, lineHeight: 1 }}
                  >
                    Precios
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.25,
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    }}
                  >
                    {canViewAdminColumns && (
                      <ProductField
                        label="Costo"
                        value={formatCurrency(product.costPrice)}
                      />
                    )}
                    <ProductField
                      label="Venta"
                      value={formatCurrency(product.salePrice)}
                    />
                    <ProductField
                      label="Precio final"
                      value={formatCurrency(product.finalPrice)}
                      info={FINAL_PRICE_INFO_TEXT}
                      emphasize
                    />
                    <ProductField
                      label="Promo %"
                      value={formatPercent(product.promoPercent)}
                      info={PROMO_INFO_TEXT}
                    />
                    {canViewAdminColumns && (
                      <ProductField
                        label="Margen"
                        value={formatPercent(product.marginPercent)}
                        info={MARGIN_INFO_TEXT}
                      />
                    )}
                  </Box>

                  {hasPromo && (
                    <Chip
                      size="small"
                      color="info"
                      variant="outlined"
                      label={`Promoción aplicada: ${formatPercent(product.promoPercent)}`}
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}
                </Stack>

                <Stack spacing={1.25}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 900, lineHeight: 1 }}
                  >
                    Inventario
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <Chip
                      size="small"
                      label={`${product.stock} en stock`}
                      color={stockChip.color}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={stockChip.label}
                      color={stockChip.color}
                    />
                  </Stack>

                  {canViewAdminColumns && (
                    <ProductField
                      label="Stock mínimo"
                      value={product.minStock ?? 0}
                      info={MIN_STOCK_INFO_TEXT}
                    />
                  )}
                </Stack>

                {canToggleProducts && (
                  <Stack
                    alignItems={{ xs: "stretch", md: "flex-end" }}
                    justifyContent="center"
                  >
                    <IconButton
                      onClick={() => onToggleProduct(product.id)}
                      disabled={Boolean(togglingProductId)}
                      title="Activar/desactivar producto"
                      aria-label={`Activar o desactivar ${product.name}`}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <ToggleOffIcon
                        color={isToggleInProgress ? "disabled" : "action"}
                      />
                    </IconButton>
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ProductsPage() {
  const { can } = useAuth();
  const canCreateProduct = can(PERMISSIONS.ProductsCreate);
  const canImportProducts = can(PERMISSIONS.ProductsImport);
  const canToggleProducts = can(PERMISSIONS.ProductsToggleActive);
  const canViewAdminColumns =
    canCreateProduct || canImportProducts || canToggleProducts;

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
        togglingProductId={togglingProductId}
        onToggleProduct={toggleProduct}
      />

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
