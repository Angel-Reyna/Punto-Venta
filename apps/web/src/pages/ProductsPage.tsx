import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField
} from "@mui/material";

import {
  DataGrid,
  GridColDef
} from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
import { getApiErrorMessage } from "../utils/apiError";

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
    }
  }

  async function downloadTemplate() {
    setError("");
    setIsDownloadingTemplate(true);

    try {
      const response = await api.get("/products/template/excel", {
        responseType: "blob"
      });

      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "formato-productos.xlsx";
      anchor.click();

      URL.revokeObjectURL(url);
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
        headerName: "Clave/SKU",
        width: 140
      },
      {
        field: "barcode",
        headerName: "Código del producto",
        width: 150,
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
        width: 120,
        valueFormatter: (value) => `${Number(value).toFixed(2)}%`
      },
      {
        field: "finalPrice",
        headerName: "Precio final",
        width: 140,
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
        headerName: "Clave/SKU",
        width: 140
      },
      {
        field: "barcode",
        headerName: "Código del producto",
        width: 150,
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
        width: 120,
        valueFormatter: (value) => `${Number(value).toFixed(2)}%`
      },
      {
        field: "finalPrice",
        headerName: "Precio final",
        width: 140,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
      },
      {
        field: "marginPercent",
        headerName: "Margen de ganancia %",
        width: 130,
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
        width: 120
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
    isInvalidNonNegativeInteger(form.minStock);

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

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: canViewAdminColumns ? 1180 : 860 }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              hideFooter={rows.length <= 25}
              pageSizeOptions={[25, 50, 100]}
            />
          </Box>
        </CardContent>
      </Card>

      {canCreateProduct && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
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
                    label="Clave interna/SKU"
                    value={form.sku}
                    helperText="SKU identifica internamente el producto. Debe ser único."
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
                    label="Código del producto"
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
                    label="Promoción (%)"
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
                    label="Stock inicial"
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
                    label="Stock mínimo"
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
                    Guardar producto
                  </Button>
                </Grid>
              </Grid>

            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}