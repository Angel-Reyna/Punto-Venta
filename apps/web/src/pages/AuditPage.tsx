import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Alert
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
  recordId?: string;
  ipAddress?: string;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
  };
};

export function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await api.get("/audit");
      setRows(response.data);
    } catch {
      setError("No se pudo cargar la auditoría");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190
    },
    {
      field: "action",
      headerName: "Acción",
      width: 190,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
        />
      )
    },
    {
      field: "tableName",
      headerName: "Tabla",
      width: 160
    },
    {
      field: "recordId",
      headerName: "Registro",
      flex: 1,
      minWidth: 220,
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
      width: 130,
      valueGetter: (_value, row) => row.user?.role ?? "N/A"
    },
    {
      field: "ipAddress",
      headerName: "IP",
      width: 160,
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
        <Chip
          color="primary"
          label="Acceso exclusivo ADMIN"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1080 }}>
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