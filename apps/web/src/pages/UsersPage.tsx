import { FormEvent, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  const [rows, setRows] = useState<User[]>([]);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER"
  });

  async function load() {
    const response = await api.get("/users");
    setRows(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setMessage("");

    await api.post("/users", form);

    setMessage("Usuario creado correctamente");

    setForm({
      name: "",
      email: "",
      password: "",
      role: "CASHIER"
    });

    await load();
  }

  async function toggleUser(userId: string) {
    await api.patch(`/users/${userId}/toggle`);

    setMessage("Estado del usuario actualizado");

    await load();
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
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === "ADMIN"
              ? "primary"
              : "success"
          }
        />
      )
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Activo" : "Inactivo"}
          size="small"
          color={params.value ? "success" : "default"}
        />
      )
    },
    {
      field: "actions",
      headerName: "",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => toggleUser(params.row.id)}
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
        subtitle="Administración exclusiva para usuarios con rol ADMIN"
      />

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

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
              helperText="Mínimo 8 caracteres, una mayúscula, una minúscula y un número."
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
                !form.password ||
                !form.role
              }
            >
              Crear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 820 }}>
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