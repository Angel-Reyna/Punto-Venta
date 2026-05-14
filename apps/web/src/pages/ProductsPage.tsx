import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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

type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;

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
  sku: "",
  name: "",
  description: "",
  costPrice: 0,
  salePrice: 0,
  promoPercent: 0,
  stock: 0,
  minStock: 0
};

export function ProductsPage() {
  const { isAdmin } = useAuth();

  const [rows, setRows] =
    useState<Product[]>([]);

  const [open, setOpen] =
    useState(false);

  const [form, setForm] =
    useState(initialForm);

  const [message, setMessage] =
    useState("");

  async function load() {
    const response =
      await api.get("/products");

    setRows(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    await api.post(
      "/products",
      form
    );

    setOpen(false);

    setForm(initialForm);

    await load();
  }

  async function downloadTemplate() {
    const response =
      await api.get(
        "/products/template/excel",
        {
          responseType: "blob"
        }
      );

    const url =
      URL.createObjectURL(
        response.data
      );

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      "formato-productos.xlsx";

    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function importExcel(
    file?: File
  ) {
    if (!file) return;

    const formData =
      new FormData();

    formData.append("file", file);

    const response =
      await api.post(
        "/products/import/excel",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      );

    setMessage(
      `Productos importados: ${response.data.imported}`
    );

    await load();
  }

  async function toggleProduct(
    productId: string
  ) {
    await api.patch(
      `/products/${productId}/toggle`
    );

    await load();
  }

  const columns =
    useMemo<GridColDef[]>(() => {
      const baseColumns: GridColDef[] = [
        {
          field: "sku",
          headerName: "SKU",
          width: 130
        },

        {
          field: "name",
          headerName: "Producto",
          flex: 1,
          minWidth: 220
        },

        {
          field: "salePrice",
          headerName: "Venta",
          width: 110,
          valueFormatter: (value) =>
            `$${Number(value).toFixed(2)}`
        },

        {
          field: "promoPercent",
          headerName: "Promo %",
          width: 110,
          valueFormatter: (value) =>
            `${Number(value).toFixed(2)}%`
        },

        {
          field: "finalPrice",
          headerName: "Precio final",
          width: 140,
          valueFormatter: (value) =>
            `$${Number(value).toFixed(2)}`
        },

        {
          field: "stock",
          headerName: "Stock",
          width: 90
        }
      ];

      if (!isAdmin) {
        return baseColumns;
      }

      return [
        ...baseColumns.slice(0, 2),

        {
          field: "costPrice",
          headerName: "Costo",
          width: 110,
          valueFormatter: (value) =>
            `$${Number(value).toFixed(2)}`
        },

        ...baseColumns.slice(2),

        {
          field: "marginPercent",
          headerName: "Margen %",
          width: 120,
          valueFormatter: (value) =>
            `${Number(value).toFixed(2)}%`
        },

        {
          field: "minStock",
          headerName: "Stock mín.",
          width: 110
        },

        {
          field: "isActive",
          headerName: "Activo",
          width: 90,
          valueFormatter: (value) =>
            value ? "Sí" : "No"
        },

        {
          field: "actions",
          headerName: "",
          width: 90,
          sortable: false,
          filterable: false,

          renderCell: (params) => (
            <IconButton
              onClick={() =>
                toggleProduct(params.row.id)
              }
            >
              <ToggleOffIcon />
            </IconButton>
          )
        }
      ];
    }, [isAdmin]);

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle={
          isAdmin
            ? "Alta, edición, promociones, costos y carga por Excel"
            : "Consulta de productos disponibles"
        }
        action={
          isAdmin && (
            <Button
              fullWidth
              startIcon={<AddIcon />}
              onClick={() =>
                setOpen(true)
              }
            >
              Nuevo
            </Button>
          )
        }
      />

      {message && (
        <Alert
          sx={{ mb: 2 }}
          severity="success"
        >
          {message}
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
            Descargar formato Excel
          </Button>

          <Button
            fullWidth
            component="label"
            startIcon={<UploadIcon />}
          >
            Importar Excel

            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) =>
                importExcel(
                  event.target.files?.[0]
                )
              }
            />
          </Button>
        </Box>
      )}

      <Card>
        <CardContent
          sx={{
            overflowX: "auto"
          }}
        >
          <Box
            sx={{
              minWidth: isAdmin
                ? 1180
                : 760
            }}
          >
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
          onClose={() =>
            setOpen(false)
          }
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Nuevo producto
          </DialogTitle>

          <DialogContent>
            <Box
              component="form"
              onSubmit={submit}
              sx={{ mt: 1 }}
            >
              <Grid
                container
                spacing={2}
              >
                {Object.entries(form).map(
                  ([key, value]) => (
                    <Grid
                      item
                      xs={12}
                      md={
                        key ===
                        "description"
                          ? 12
                          : 6
                      }
                      key={key}
                    >
                      <TextField
                        fullWidth
                        label={key}
                        value={value}
                        type={
                          typeof value ===
                          "number"
                            ? "number"
                            : "text"
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,

                            [key]:
                              typeof value ===
                              "number"
                                ? Number(
                                    event.target
                                      .value
                                  )
                                : event.target
                                    .value
                          })
                        }
                      />
                    </Grid>
                  )
                )}

                <Grid
                  item
                  xs={12}
                >
                  <Button
                    type="submit"
                    fullWidth
                  >
                    Guardar
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