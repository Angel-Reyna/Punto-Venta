import { FormEvent, useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField
} from "@mui/material";

import {
  DataGrid,
  GridColDef
} from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  isActive: boolean;
  createdAt: string;
};

export function UsersPage() {
  const [rows, setRows] =
    useState<User[]>([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER"
  });

  async function load() {
    const response =
      await api.get("/users");

    setRows(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    await api.post("/users", form);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "CASHIER"
    });

    load();
  }

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Nombre",
      flex: 1,
      minWidth: 180
    },
    {
      field: "email",
      headerName: "Correo",
      flex: 1,
      minWidth: 220
    },
    {
      field: "role",
      headerName: "Rol",
      width: 120
    },
    {
      field: "isActive",
      headerName: "Activo",
      width: 100
    },
    {
      field: "actions",
      headerName: "",
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() =>
            api
              .patch(
                `/users/${params.row.id}/toggle`
              )
              .then(load)
          }
        >
          Cambiar
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administradores y cajeros"
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            component="form"
            onSubmit={submit}
            sx={{
              display: "flex",

              flexDirection: {
                xs: "column",
                md: "row"
              },

              gap: 2
            }}
          >
            <TextField
              fullWidth
              label="Nombre"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value
                })
              }
            />

            <TextField
              fullWidth
              label="Correo"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value
                })
              }
            />

            <TextField
              select
              fullWidth
              label="Rol"
              value={form.role}
              onChange={(event) =>
                setForm({
                  ...form,
                  role: event.target.value
                })
              }
            >
              <MenuItem value="ADMIN">
                ADMIN
              </MenuItem>

              <MenuItem value="CASHIER">
                CASHIER
              </MenuItem>
            </TextField>

            <Button
              type="submit"
              fullWidth
              disabled={
                !form.name ||
                !form.email ||
                !form.password
              }
            >
              Crear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          sx={{
            overflowX: "auto"
          }}
        >
          <Box
            sx={{
              minWidth: 760
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
    </>
  );
}