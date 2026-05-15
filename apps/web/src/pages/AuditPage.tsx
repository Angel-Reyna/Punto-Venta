import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip
} from "@mui/material";

import {
  DataGrid,
  GridColDef
} from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

type AuditLog = {
  id: string;
  action: string;
  tableName: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
  } | null;
};

export function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");

      const response = await api.get<AuditLog[]>("/audit");

      setRows(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo cargar la auditoría"
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    {
      field: "action",
      headerName: "Acción",
      width: 210,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: "tableName",
      headerName: "Tabla",
      width: 170
    },
    {
      field: "recordId",
      headerName: "Registro",
      flex: 1,
      minWidth: 240,
      valueGetter: (_value, row) => row.recordId || "N/A"
    },
    {
      field: "user",
      headerName: "Usuario",
      flex: 1,
      minWidth: 260,
      valueGetter: (_value, row) =>
        row.user
          ? `${row.user.name} (${row.user.email})`
          : "Sistema"
    },
    {
      field: "role",
      headerName: "Rol",
      width: 140,
      valueGetter: (_value, row) => row.user?.role ?? "N/A",
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "ADMIN" ? "primary" : "success"}
          variant="outlined"
        />
      )
    },
    {
      field: "ipAddress",
      headerName: "IP",
      width: 170,
      valueGetter: (_value, row) => row.ipAddress || "N/A"
    }
  ];

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Historial administrativo de acciones críticas del sistema"
      />

      <Box sx={{ mb: 2 }}>
        <Chip color="primary" label="Acceso exclusivo ADMIN" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1180 }}>
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