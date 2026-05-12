import { useEffect, useState } from "react";

import {
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
  recordId?: string;
  ipAddress?: string;
  createdAt: string;

  user?: {
    name: string;
    email: string;
  };
};

export function AuditPage() {
  const [rows, setRows] =
    useState<AuditLog[]>([]);

  async function load() {
    const response =
      await api.get("/audit");

    setRows(response.data);
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
      width: 160,

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
      minWidth: 220
    },

    {
      field: "user",
      headerName: "Usuario",
      flex: 1,
      minWidth: 220,

      valueGetter: (
        _value,
        row
      ) =>
        row.user
          ? `${row.user.name} (${row.user.email})`
          : "Sistema"
    },

    {
      field: "ipAddress",
      headerName: "IP",
      width: 160
    }
  ];

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Historial de movimientos y acciones del sistema"
      />

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
    </>
  );
}