import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Typography
} from "@mui/material";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

type ReportData = {
  count: number;
  subtotal: number;
  discount: number;
  total: number;
};

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [data, setData] = useState<ReportData | null>(null);

  const [error, setError] = useState("");

  function datesAreInvalid() {
    return !from || !to || new Date(from) > new Date(to);
  }

  async function consult() {
    setError("");

    if (datesAreInvalid()) {
      setError("El rango de fechas no es válido");
      return;
    }

    const response = await api.get(`/reports/sales?from=${from}&to=${to}`);

    setData(response.data);
  }

  async function downloadPdf() {
    setError("");

    if (datesAreInvalid()) {
      setError("El rango de fechas no es válido");
      return;
    }

    const response = await api.get(`/reports/sales/pdf?from=${from}&to=${to}`, {
      responseType: "blob"
    });

    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `reporte-ventas-${from}-${to}.pdf`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Consulta administrativa de ventas por rango de fechas"
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
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: {
                xs: "column",
                md: "row"
              },
              gap: 2,
              mb: 3
            }}
          >
            <TextField
              fullWidth
              label="Desde"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />

            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />

            <Button
              fullWidth
              onClick={consult}
              disabled={datesAreInvalid()}
            >
              Consultar
            </Button>

            <Button
              fullWidth
              onClick={downloadPdf}
              disabled={datesAreInvalid()}
            >
              Descargar PDF
            </Button>
          </Box>

          {data && (
            <Box>
              <Typography>
                Ventas: {data.count}
              </Typography>

              <Typography>
                Subtotal: ${data.subtotal.toFixed(2)}
              </Typography>

              <Typography>
                Descuentos: ${data.discount.toFixed(2)}
              </Typography>

              <Typography
                variant="h5"
                fontWeight={800}
                sx={{
                  mt: 1,
                  fontSize: {
                    xs: "1.4rem",
                    sm: "1.8rem"
                  }
                }}
              >
                Total: ${data.total.toFixed(2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}