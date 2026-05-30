import type { ReactNode } from "react";

import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatMoney, type OperationsReport } from "./reportShared";

export function ReportsHero({ data, periodLabel }: { data: OperationsReport | null; periodLabel: string }) {
  return (
    <Card
      sx={{
        mb: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
            theme.palette.info.main,
            0.1
          )} 44%, ${theme.palette.background.paper} 100%)`
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          gap={{ xs: 2, md: 3 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
              <Chip color="primary" label="Reporte operativo ADMIN" />
              <Chip variant="outlined" label={`Periodo: ${periodLabel}`} />
              <Chip
                variant="outlined"
                color={data ? "success" : "default"}
                label={data ? "Datos consultados" : "Pendiente de consulta"}
              />
            </Stack>
            <Typography component="h1" variant="h4" fontWeight={900} sx={{ letterSpacing: -0.4 }}>
              Reportes
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
              Entiende cuánto se vendió, qué utilidad dejó el periodo, qué productos se movieron y
              cómo participó cada vendedor. En celular se prioriza el resumen; en tablet y PC se
              muestran más detalles para análisis.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(2, minmax(120px, 1fr))"
              },
              gap: 1,
              minWidth: { lg: 360 }
            }}
          >
            <HeroStat icon={<PeopleAltOutlinedIcon />} label="Vendedores" value={data?.sales.bySeller.length ?? 0} />
            <HeroStat icon={<Inventory2OutlinedIcon />} label="Productos" value={data?.topProducts.length ?? 0} />
            <HeroStat icon={<PaymentsOutlinedIcon />} label="Venta neta" value={formatMoney(data?.sales.net)} />
            <HeroStat icon={<AssignmentReturnOutlinedIcon />} label="Devuelto" value={formatMoney(data?.sales.refunded)} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function HeroStat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72),
        p: 1.25,
        minWidth: 0
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "primary.main" }}>
        {icon}
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body1" fontWeight={900} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
}
