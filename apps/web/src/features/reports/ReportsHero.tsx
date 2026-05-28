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
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={2.5}
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
              Revisa ventas netas, devoluciones, productos vendidos y desempeño por vendedor con
              indicadores rápidos y detalle operativo.
            </Typography>
          </Box>

          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
          >
            <Chip icon={<PeopleAltOutlinedIcon />} label={`${data?.sales.bySeller.length ?? 0} vendedores`} />
            <Chip icon={<Inventory2OutlinedIcon />} label={`${data?.topProducts.length ?? 0} productos`} />
            <Chip
              icon={<PaymentsOutlinedIcon />}
              label={formatMoney(data?.sales.net)}
              color={data ? "success" : "default"}
            />
            <Chip
              icon={<AssignmentReturnOutlinedIcon />}
              label={formatMoney(data?.sales.refunded)}
              color={data ? "warning" : "default"}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
