import { FormEvent, useEffect, useState } from "react";

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
  description?: string;
  costPrice: number;
  salePrice: number;
  promoPercent: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  marginPercent: number;
  finalPrice: number;
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
  const { user } = useAuth();

  const isAdmin =
    user?.role === "ADMIN";

  const [rows, setRows] = useState<
    Product[]
  >([]);

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

    load();
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
        formData
      );

    setMessage(
      `Productos importados: ${response.data.imported}`
    );

    load();
  }

  const columns: GridColDef[] = [
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
      field: "costPrice",
      headerName: "Costo",
      width: 100
    },

    {
      field: "salePrice",
      headerName: "Venta",
      width: 100
    },

    {
      field: "marginPercent",
      headerName: "Margen %",
      width: 110
    },

    {
      field: "promoPercent",
      headerName: "Promo %",
      width: 110
    },

    {
      field: "finalPrice",
      headerName: "Precio final",
      width: 130
    },

    {
      field: "stock",
      headerName: "Stock",
      width: 90
    },

    {
      field: "isActive",
      headerName: "Activo",
      width: 90
    },

    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: "",
            width: 80,
            sortable: false,

            renderCell: (
              params: any
            ) => (
              <IconButton
                onClick={() =>
                  api
                    .patch(
                      `/products/${params.row.id}/toggle`
                    )
                    .then(load)
                }
              >
                <ToggleOffIcon />
              </IconButton>
            )
          }
        ]
      : [])
  ];

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="Alta manual, consulta, promociones y carga por Excel"
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
            startIcon={
              <DownloadIcon />
            }
            onClick={
              downloadTemplate
            }
          >
            Descargar formato Excel
          </Button>

          <Button
            fullWidth
            component="label"
            startIcon={
              <UploadIcon />
            }
          >
            Importar Excel

            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) =>
                importExcel(
                  event.target
                    .files?.[0]
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
              minWidth: 980
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
              {Object.entries(
                form
              ).map(
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
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,

                          [key]:
                            typeof value ===
                            "number"
                              ? Number(
                                  event
                                    .target
                                    .value
                                )
                              : event
                                  .target
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
    </>
  );
}