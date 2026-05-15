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

type UserRole = "ADMIN" | "CASHIER";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

const initialForm: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
} = {
  name: "",
  email: "",
  password: "",
  role: "CASHIER"
};

export function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState(initialForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");

      const response = await api.get<User[]>("/users");

      setRows(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudieron cargar los usuarios"
      );
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
      await api.post("/users", {
        name: typeof form.name === "string" ? form.name.trim() : "",
        email: typeof form.email === "string" ? form.email.trim() : "",
        password: form.password,
        role: form.role
      });

      setMessage("Usuario creado correctamente");

      setForm(initialForm);

      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo crear el usuario"
      );
    }
  }

  async function toggleUser(userId: string) {
    setMessage("");
    setError("");

    try {
      await api.patch(`/users/${userId}/toggle`);

      setMessage("Estado del usuario actualizado");

      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo actualizar el usuario"
      );
    }
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
      minWidth: 240
    },
    {
      field: "role",
      headerName: "Rol",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "ADMIN" ? "primary" : "success"}
        />
      )
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Activo" : "Inactivo"}
          size="small"
          color={params.value ? "success" : "default"}
          variant="outlined"
        />
      )
    },
    {
      field: "createdAt",
      headerName: "Creado",
      width: 190,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    {
      field: "actions",
      headerName: "",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => toggleUser(params.row.id)}
        >
          {params.row.isActive ? "Desactivar" : "Activar"}
        </Button>
      )
    }
  ];

  const passwordIsValid =
    typeof form.password === "string" &&
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /[0-9]/.test(form.password);

  const formIsInvalid =
    !(typeof form.name === "string" && form.name.trim()) ||
    !(typeof form.email === "string" && form.email.trim()) ||
    !passwordIsValid ||
    !form.role;

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administración exclusiva para usuarios con rol ADMIN"
      />

      <Box sx={{ mb: 2 }}>
        <Chip color="primary" label="Acceso exclusivo ADMIN" />
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
              type="email"
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
              error={Boolean(form.password) && !passwordIsValid}
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
                  role: event.target.value as UserRole
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
              disabled={formIsInvalid}
            >
              Crear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 980 }}>
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