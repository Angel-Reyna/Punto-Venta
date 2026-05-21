import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField
} from "@mui/material";

import { GridColDef } from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { api } from "../api/client";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { DataGridCard } from "../components/DataGridCard";
import { LabelWithInfo } from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
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
  minStock: ""
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

function renderHeaderWithInfo(label: string, info: string) {
  return <LabelWithInfo label={label} info={info} ariaLabel={info} />;
}

export function ProductsPage() {
  const { can } = useAuth();
  const canCreateProduct = can(PERMISSIONS.ProductsCreate);
  const canImportProducts = can(PERMISSIONS.ProductsImport);
  const canToggleProducts = can(PERMISSIONS.ProductsToggleActive);
  const canViewAdminColumns = canCreateProduct || canImportProducts || canToggleProducts;

  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  async function load() {
    try {
      setError("");

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get<Product[]>("/products"),
        canCreateProduct
          ? api.get<ProductCategory[]>("/products/categories")
          : Promise.resolve({ data: [] as ProductCategory[] })
      ]);

      setRows(productsResponse.data);
      setCategories(categoriesResponse.data);
    } catch {
      setError("No se pudo cargar el catálogo de productos.");
    }
  }

  useEffect(() => {
    void load();
  }, [canCreateProduct]);

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
        minStock: toNonNegativeNumber(form.minStock)
      });

      setMessage("Producto creado correctamente.");
      setOpen(false);
      setForm(initialForm);

      await load();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo crear el producto. Revisa SKU, precios y campos obligatorios."
        )
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
        responseType: "blob"
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

      const response = await api.post(
        "/products/import/excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMessage(`Productos importados: ${response.data.imported}`);

      await load();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo importar el archivo Excel. Verifica que uses el formato correcto."
        )
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
      setError(
        getApiErrorMessage(
          err,
          "No se pudo actualizar el producto."
        )
      );
    } finally {
      setTogglingProductId(null);
    }
  }

  const columns = useMemo<GridColDef[]>(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "sku",
        headerName: "Clave interna/SKU",
        renderHeader: () => renderHeaderWithInfo("Clave interna/SKU", SKU_INFO_TEXT),
        width: 180
      },
      {
        field: "barcode",
        headerName: "Código del producto",
        renderHeader: () => renderHeaderWithInfo("Código", PRODUCT_CODE_INFO_TEXT),
        width: 170,
        valueGetter: (_value, row) => row.barcode || "N/A"
      },
      {
        field: "name",
        headerName: "Producto",
        flex: 1,
        minWidth: 220
      },
      {
        field: "category",
        headerName: "Categoría",
        width: 160,
        valueGetter: (_value, row) => row.category?.name ?? "Sin categoría"
      },
      {
        field: "salePrice",
        headerName: "Venta",
        width: 120,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
      },
      {
        field: "promoPercent",
        headerName: "Promo %",
        renderHeader: () => renderHeaderWithInfo("Promo %", PROMO_INFO_TEXT),
        width: 120,
        valueFormatter: (value) => `${Number(value).toFixed(2)}%`
      },
      {
        field: "finalPrice",
        headerName: "Precio final",
        renderHeader: () => renderHeaderWithInfo("Precio final", FINAL_PRICE_INFO_TEXT),
        width: 145,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
      },
      {
        field: "stock",
        headerName: "Stock",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={Number(params.value) <= 0 ? "error" : "success"}
            variant="outlined"
          />
        )
      }
    ];

    if (!canViewAdminColumns) {
      return baseColumns;
    }

    return [
      {
        field: "sku",
        headerName: "Clave interna/SKU",
        renderHeader: () => renderHeaderWithInfo("Clave interna/SKU", SKU_INFO_TEXT),
        width: 180
      },
      {
        field: "barcode",
        headerName: "Código del producto",
        renderHeader: () => renderHeaderWithInfo("Código", PRODUCT_CODE_INFO_TEXT),
        width: 170,
        valueGetter: (_value, row) => row.barcode || "N/A"
      },
      {
        field: "name",
        headerName: "Producto",
        flex: 1,
        minWidth: 220
      },
      {
        field: "category",
        headerName: "Categoría",
        width: 160,
        valueGetter: (_value, row) => row.category?.name ?? "Sin categoría"
      },
      {
        field: "costPrice",
        headerName: "Costo",
        width: 120,
        valueFormatter: (value) => `$${Number(value ?? 0).toFixed(2)}`
      },
      {
        field: "salePrice",
        headerName: "Venta",
        width: 120,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
      },
      {
        field: "promoPercent",
        headerName: "Promo %",
        renderHeader: () => renderHeaderWithInfo("Promo %", PROMO_INFO_TEXT),
        width: 120,
        valueFormatter: (value) => `${Number(value).toFixed(2)}%`
      },
      {
        field: "finalPrice",
        headerName: "Precio final",
        renderHeader: () => renderHeaderWithInfo("Precio final", FINAL_PRICE_INFO_TEXT),
        width: 145,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
      },
      {
        field: "marginPercent",
        headerName: "Margen de ganancia %",
        renderHeader: () => renderHeaderWithInfo("Margen", MARGIN_INFO_TEXT),
        width: 135,
        valueFormatter: (value) => `${Number(value ?? 0).toFixed(2)}%`
      },
      {
        field: "stock",
        headerName: "Stock",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={Number(params.value) <= 0 ? "error" : "success"}
            variant="outlined"
          />
        )
      },
      {
        field: "minStock",
        headerName: "Stock mín.",
        renderHeader: () => renderHeaderWithInfo("Stock mín.", MIN_STOCK_INFO_TEXT),
        width: 130
      },
      {
        field: "isActive",
        headerName: "Estado",
        width: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? "Activo" : "Inactivo"}
            color={params.value ? "success" : "default"}
          />
        )
      },
      ...(canToggleProducts ? [{
        field: "actions",
        headerName: "",
        width: 90,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <IconButton
            onClick={() => toggleProduct(params.row.id)}
            disabled={Boolean(togglingProductId)}
            title="Activar/desactivar"
          >
            <ToggleOffIcon />
          </IconButton>
        )
      } satisfies GridColDef] : [])
    ];
  }, [canViewAdminColumns, canToggleProducts, togglingProductId]);

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
    if (isInvalidNonNegativeNumber(form.costPrice)) return "El costo debe ser un número mayor o igual a cero.";
    if (isInvalidNonNegativeNumber(form.salePrice)) return "El precio de venta debe ser un número mayor o igual a cero.";
    if (isInvalidNonNegativeNumber(form.promoPercent) || promoPercent > 100) {
      return "La promoción debe estar entre 0 y 100%.";
    }
    if (isInvalidNonNegativeInteger(form.initialStock)) return "El stock inicial debe ser un entero mayor o igual a cero.";
    if (isInvalidNonNegativeInteger(form.minStock)) return "El stock mínimo debe ser un entero mayor o igual a cero.";
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

      {canImportProducts && (
        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row"
            },
            gap: 1,
            mb: 2
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

      <DataGridCard
        rows={rows}
        columns={columns}
        minWidth={canViewAdminColumns ? 1120 : 820}
        pageSizeOptions={[25, 50, 100]}
        singlePageThreshold={25}
        noRowsLabel="No hay productos registrados."
        tableLabel="Catálogo de productos"
      />

      {canCreateProduct && (
        <Dialog
          open={open}
          onClose={() => {
            if (!isCreatingProduct) {
              setOpen(false);
            }
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Nuevo producto</DialogTitle>

          <DialogContent>
            <Box
              component="form"
              onSubmit={submit}
              sx={{
                mt: 1
              }}
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
                        sku: event.target.value
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
                        barcode: code
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
                        barcode: event.target.value
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
                        categoryId: event.target.value
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
                        name: event.target.value
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
                        description: event.target.value
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
                      step: 0.01
                    }}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        costPrice: event.target.value
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
                      step: 0.01
                    }}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        salePrice: event.target.value
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
                      step: 0.01
                    }}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        promoPercent: event.target.value
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
                      step: 1
                    }}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        initialStock: event.target.value
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
                      step: 1
                    }}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        minStock: event.target.value
                      })
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={formIsInvalid}
                  >
                    {isCreatingProduct ? "Guardando..." : "Guardar producto"}
                  </Button>
                  <ActionDisabledReason message={formIsInvalid ? productFormDisabledReason : ""} />
                </Grid>
              </Grid>

            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}