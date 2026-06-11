import type { ReactNode } from "react";

import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatMoney, type OperationsReport } from "./reportShared";

export function ReportsHero({ data }: { data: OperationsReport | null; periodLabel: string }) {
  const paymentTotal = data
    ? Object.values(data.sales.paymentSummary).reduce((total, amount) => total + amount, 0)
    : 0;

  return (
    <Card
      sx={{
        overflow: "hidden",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
        background: (theme) =>
          `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.2)}, transparent 34%), linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.1
          )} 0%, ${alpha(theme.palette.info.main, 0.08)} 46%, ${theme.palette.background.paper} 100%)`
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          gap={{ xs: 2, md: 3 }}
        >
          <Stack direction="row" spacing={1.6} sx={{ minWidth: 0 }}>
            <HeroIcon>
              <AssessmentOutlinedIcon fontSize="large" />
            </HeroIcon>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.25 }}>
                <Chip color="primary" label="Centro de reportes" />
                <Chip
                  variant="outlined"
                  color={data ? "success" : "default"}
                  label={data ? "Datos consultados" : "Pendiente de consulta"}
                />
              </Stack>
              <Typography component="h1" variant="h4" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                Reportes
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                Revisa venta neta, utilidad, merma, vendedores y productos desde una lectura ejecutiva.
                Consulta el periodo primero y usa el PDF como salida final para respaldar el corte.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(2, minmax(128px, 1fr))"
              },
              gap: 1,
              minWidth: { lg: 380 }
            }}
          >
            <HeroStat icon={<PeopleAltOutlinedIcon />} label="Vendedores" value={data?.sales.bySeller.length ?? 0} />
            <HeroStat icon={<Inventory2OutlinedIcon />} label="Productos" value={data?.topProducts.length ?? 0} />
            <HeroStat icon={<LocalAtmOutlinedIcon />} label="Cobros" value={formatMoney(paymentTotal)} />
            <HeroStat icon={<AssignmentReturnOutlinedIcon />} label="Devuelto" value={formatMoney(data?.sales.refunded)} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function HeroIcon({ children }: { children: ReactNode }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        alignItems: "center",
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.13),
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
        borderRadius: 3,
        color: "primary.main",
        display: "inline-flex",
        flexShrink: 0,
        height: 58,
        justifyContent: "center",
        width: 58
      }}
    >
      {children}
    </Box>
  );
}

function HeroStat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.74),
        minWidth: 0,
        p: 1.25,
        textAlign: "center"
      }}
    >
      <Stack alignItems="center" justifyContent="center" spacing={0.55} sx={{ color: "primary.main" }}>
        <Box
          aria-hidden="true"
          sx={{
            alignItems: "center",
            display: "inline-flex",
            justifyContent: "center",
            minHeight: 26
          }}
        >
          {icon}
        </Box>
        <Typography variant="caption" color="text.secondary" fontWeight={850}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body1" fontWeight={950} sx={{ mt: 0.65, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
}
