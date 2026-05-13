import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Chip
} from "@mui/material";

import InventoryIcon from "@mui/icons-material/Inventory2";
import WarningIcon from "@mui/icons-material/WarningAmber";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaidIcon from "@mui/icons-material/Paid";

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

  const [metrics, setMetrics] =
    useState<DashboardMetrics | null>(null);

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => {
        setMetrics(data);
      });
  }, []);

  const cards = [
    ...(isAdmin
      ? [
          {
            title: "Productos activos",
            value: metrics?.products ?? 0,
            icon: (
              <InventoryIcon fontSize="large" />
            )
          },

          {
            title: "Bajo inventario",
            value: metrics?.lowStock ?? 0,
            icon: (
              <WarningIcon fontSize="large" />
            )
          }
        ]
      : []),

    {
      title: "Ventas de hoy",
      value:
        metrics?.todaySalesCount ?? 0,

      icon: (
        <PointOfSaleIcon fontSize="large" />
      )
    },

    {
      title: "Total vendido hoy",
      value: `$${(
        metrics?.todaySalesTotal ?? 0
      ).toFixed(2)}`,

      icon: (
        <PaidIcon fontSize="large" />
      )
    },

    ...(isAdmin
      ? [
          {
            title: "Usuarios activos",
            value: metrics?.users ?? 0,

            icon: (
              <InventoryIcon fontSize="large" />
            )
          }
        ]
      : [])
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

      <Box sx={{ mb: 3 }}>
        <Chip
          label={
            isAdmin
              ? "Administrador"
              : "Vendedor"
          }

          color={
            isAdmin
              ? "primary"
              : "success"
          }
        />
      </Box>

      <Grid
        container
        spacing={2}
      >
        {cards.map((card) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={4}
            key={card.title}
          >
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
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    mb: 2
                  }}
                >
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