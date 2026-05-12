import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
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
  const today =
    new Date().toISOString().slice(0, 10);

  const [from, setFrom] =
    useState(today);

  const [to, setTo] =
    useState(today);

  const [data, setData] =
    useState<ReportData | null>(null);

  async function consult() {
    const response = await api.get(
      `/reports/sales?from=${from}&to=${to}`
    );

    setData(response.data);
  }

  async function downloadPdf() {
    const response = await api.get(
      `/reports/sales/pdf?from=${from}&to=${to}`,
      {
        responseType: "blob"
      }
    );

    const url =
      URL.createObjectURL(response.data);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = "reporte-ventas.pdf";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Ventas por rango de fechas y descarga en PDF"
      />

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
              onChange={(event) =>
                setFrom(event.target.value)
              }
              InputLabelProps={{
                shrink: true
              }}
            />

            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={to}
              onChange={(event) =>
                setTo(event.target.value)
              }
              InputLabelProps={{
                shrink: true
              }}
            />

            <Button
              fullWidth
              onClick={consult}
            >
              Consultar
            </Button>

            <Button
              fullWidth
              onClick={downloadPdf}
            >
              PDF
            </Button>
          </Box>

          {data && (
            <Box>
              <Typography>
                Ventas: {data.count}
              </Typography>

              <Typography>
                Subtotal: $
                {data.subtotal.toFixed(2)}
              </Typography>

              <Typography>
                Descuentos: $
                {data.discount.toFixed(2)}
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