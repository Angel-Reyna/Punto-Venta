import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography
} from "@mui/material";

import InventoryIcon from "@mui/icons-material/Inventory2";
import WarningIcon from "@mui/icons-material/WarningAmber";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";

type DashboardMetrics = {
  role: "ADMIN" | "CASHIER";
  products: number;
  lowStock: number;
  users: number;
  todaySalesCount: number;
  todaySalesTotal: number;
};

export function DashboardPage() {
  const { isAdmin } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");

      const response = await api.get<DashboardMetrics>("/dashboard");

      setMetrics(response.data);
    } catch {
      setError("No se pudo cargar el dashboard");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards = [
    ...(isAdmin
      ? [
          {
            title: "Productos activos",
            value: metrics?.products ?? 0,
            icon: <InventoryIcon fontSize="large" />,
            description: "Productos disponibles en catálogo"
          },
          {
            title: "Bajo inventario",
            value: metrics?.lowStock ?? 0,
            icon: <WarningIcon fontSize="large" />,
            description: "Productos en o debajo del stock mínimo"
          },
          {
            title: "Usuarios activos",
            value: metrics?.users ?? 0,
            icon: <PeopleIcon fontSize="large" />,
            description: "Administradores y vendedores activos"
          }
        ]
      : []),

    {
      title: "Ventas de hoy",
      value: metrics?.todaySalesCount ?? 0,
      icon: <PointOfSaleIcon fontSize="large" />,
      description: isAdmin
        ? "Ventas globales completadas hoy"
        : "Tus ventas completadas hoy"
    },
    {
      title: "Total vendido hoy",
      value: `$${(metrics?.todaySalesTotal ?? 0).toFixed(2)}`,
      icon: <PaidIcon fontSize="large" />,
      description: isAdmin
        ? "Total global vendido hoy"
        : "Total vendido por ti hoy"
    }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          isAdmin
            ? "Resumen administrativo del sistema"
            : "Resumen personal de ventas"
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={isAdmin ? "primary" : "success"}
          label={isAdmin ? "Vista ADMIN" : "Vista VENDEDOR"}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} lg={isAdmin ? 4 : 6} key={card.title}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 4
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    gap: 2
                  }}
                >
                  <Box>
                    <Typography
                      color="text.secondary"
                      sx={{
                        fontSize: {
                          xs: 14,
                          sm: 16
                        }
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {card.description}
                    </Typography>
                  </Box>

                  {card.icon}
                </Box>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    fontSize: {
                      xs: "1.8rem",
                      sm: "2.2rem"
                    }
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}