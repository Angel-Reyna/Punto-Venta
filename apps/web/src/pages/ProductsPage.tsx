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

const initialForm = {
  categoryId: "",
  sku: "",
  barcode: "",
  name: "",
  description: "",
  costPrice: 0,
  salePrice: 0,
  promoPercent: 0,
  minStock: 0
};

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function ProductsPage() {
  const { isAdmin } = useAuth();

  const [rows, setRows] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");

      const response = await api.get("/products");

      setRows(response.data);
    } catch {
      setError("No se pudo cargar el catálogo de productos.");
    }
  }

  useEffect(() => {
    load();
  }, []);

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
        costPrice: Number(form.costPrice ?? 0),
        salePrice: Number(form.salePrice ?? 0),
        promoPercent: Number(form.promoPercent ?? 0),
        minStock: Number(form.minStock ?? 0)
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
    }
  }

  async function importExcel(file?: File) {
    if (!file) return;

    setMessage("");
    setError("");

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
    }
  }

  async function toggleProduct(productId: string) {
    setMessage("");
    setError("");

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
    }
  }

  const columns = useMemo<GridColDef[]>(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "sku",
        headerName: "SKU",
        width: 140
      },
      {
        field: "barcode",
        headerName: "Código",
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

    if (!isAdmin) {
      return baseColumns;
    }

    return [
      {
        field: "sku",
        headerName: "SKU",
        width: 140
      },
      {
        field: "barcode",
        headerName: "Código",
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
        headerName: "Margen %",
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
      {
        field: "actions",
        headerName: "",
        width: 90,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <IconButton
            onClick={() => toggleProduct(params.row.id)}
            title="Activar/desactivar"
          >
            <ToggleOffIcon />
          </IconButton>
        )
      }
    ];
  }, [isAdmin]);

const formIsInvalid =
  !safeTrim(form.sku) ||
  !safeTrim(form.name) ||
  Number(form.costPrice ?? 0) < 0 ||
  Number(form.salePrice ?? 0) < 0 ||
  Number(form.promoPercent ?? 0) < 0 ||
  Number(form.promoPercent ?? 0) > 100 ||
  Number(form.minStock ?? 0) < 0;

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle={
          isAdmin
            ? "Gestiona catálogo, precios, promociones, stock mínimo e importación por Excel."
            : "Consulta productos activos, precios y stock disponible."
        }
        action={
          isAdmin && (
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
          color={isAdmin ? "primary" : "success"}
          label={
            isAdmin
              ? "Vista ADMIN: productos completos"
              : "Vista VENDEDOR: catálogo activo"
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

      {isAdmin && (
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
          >
            Descargar formato
          </Button>

          <Button
            fullWidth
            component="label"
            startIcon={<UploadIcon />}
          >
            Importar productos
            <input
              hidden
              type="file"
              accept=".xlsx"
              onChange={(event) => importExcel(event.target.files?.[0])}
            />
          </Button>
        </Box>
      )}

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: isAdmin ? 1420 : 980 }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {isAdmin && (
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={form.sku}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sku: event.target.value
                      })
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Código de barras opcional"
                    value={form.barcode}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        barcode: event.target.value
                      })
                    }
                  />
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
                        costPrice: Number(event.target.value)
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
                        salePrice: Number(event.target.value)
                      })
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
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
                        promoPercent: Number(event.target.value)
                      })
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
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
                        minStock: Number(event.target.value)
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