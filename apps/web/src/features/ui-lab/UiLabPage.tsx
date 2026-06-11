import type { ElementType, ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  alpha,
  type SxProps,
  type Theme,
  useTheme,
} from "@mui/material/styles";

import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { pvVisualTokens } from "../../design-lab/pvVisualTokens";

type Tone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type ReportMetric = {
  helper: string;
  icon: ElementType;
  label: string;
  tone: Tone;
  value: string;
};

type SellerRow = {
  name: string;
  net: number;
  returns: number;
  sales: number;
};

type ProductRow = {
  margin: number;
  name: string;
  net: number;
  sku: string;
  units: number;
};

type TimelineRow = {
  amount: number;
  folio: string;
  seller: string;
  status: string;
  time: string;
};

type MovementRow = {
  amount: number;
  detail: string;
  label: string;
  tone: Tone;
};

const reportMetrics: ReportMetric[] = [
  {
    helper: "Después de devoluciones del periodo.",
    icon: PaidOutlinedIcon,
    label: "Venta neta",
    tone: "success",
    value: "$18,420.00",
  },
  {
    helper: "Venta neta menos costo y merma.",
    icon: TrendingUpOutlinedIcon,
    label: "Utilidad operativa",
    tone: "primary",
    value: "$6,318.00",
  },
  {
    helper: "Caducidad registrada en inventario.",
    icon: WarningAmberOutlinedIcon,
    label: "Merma",
    tone: "error",
    value: "$412.00",
  },
  {
    helper: "Reembolsos y ventas devueltas.",
    icon: AssignmentReturnOutlinedIcon,
    label: "Devoluciones",
    tone: "warning",
    value: "$860.00",
  },
];

const bridgeRows: MovementRow[] = [
  {
    amount: 19280,
    detail: "Ventas no canceladas antes de devoluciones.",
    label: "Venta bruta",
    tone: "success",
  },
  {
    amount: -860,
    detail: "Reembolsos aplicados en el periodo.",
    label: "Devoluciones",
    tone: "warning",
  },
  {
    amount: -10690,
    detail: "Costo histórico de productos vendidos.",
    label: "Costo neto",
    tone: "error",
  },
  {
    amount: -412,
    detail: "Merma por caducidad registrada.",
    label: "Merma",
    tone: "error",
  },
  {
    amount: 6318,
    detail: "Resultado operativo estimado.",
    label: "Utilidad operativa",
    tone: "primary",
  },
];

const sellerRows: SellerRow[] = [
  { name: "Ana López", net: 7420, returns: 180, sales: 22 },
  { name: "Carlos Ruiz", net: 6120, returns: 0, sales: 18 },
  { name: "María Torres", net: 4880, returns: 680, sales: 14 },
];

const productRows: ProductRow[] = [
  {
    margin: 42,
    name: "Coca-Cola 600 ml",
    net: 3180,
    sku: "BEB-COCA-600",
    units: 176,
  },
  {
    margin: 38,
    name: "Agua Mineral 1 L",
    net: 2480,
    sku: "AGUA-1L",
    units: 155,
  },
  {
    margin: 31,
    name: "Harina de maíz 250 g",
    net: 1840,
    sku: "ABA-HARINA-250",
    units: 72,
  },
];

const timelineRows: TimelineRow[] = [
  {
    amount: 156,
    folio: "V-000184",
    seller: "Ana López",
    status: "Completada",
    time: "Hoy · 18:42",
  },
  {
    amount: 96,
    folio: "V-000183",
    seller: "Carlos Ruiz",
    status: "Completada",
    time: "Hoy · 17:10",
  },
  {
    amount: 68,
    folio: "D-000031",
    seller: "María Torres",
    status: "Devuelta",
    time: "Hoy · 16:20",
  },
];

const dailyTrend = [0.18, 0.32, 0.24, 0.56, 0.48, 0.72, 0.66];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency",
  }).format(value);
}

function toneMain(theme: Theme, tone: Tone) {
  return theme.palette[tone].main;
}

function Surface({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Card
      sx={[
        {
          borderRadius: `${pvVisualTokens.layout.cardRadius}px`,
          overflow: "hidden",
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <CardContent sx={{ p: { xs: 1.6, md: 2.2 } }}>{children}</CardContent>
    </Card>
  );
}

function IconTile({
  icon: Icon,
  size = 42,
  tone,
}: {
  icon: ElementType;
  size?: number;
  tone: Tone;
}) {
  const theme = useTheme();
  const color = toneMain(theme, tone);

  return (
    <Box
      aria-hidden="true"
      sx={{
        background: `radial-gradient(circle at 30% 20%, ${alpha(color, 0.28)}, ${alpha(color, 0.08)} 68%)`,
        border: "1px solid",
        borderColor: alpha(color, 0.28),
        borderRadius: size > 44 ? 3.25 : 2.4,
        color,
        display: "grid",
        flex: `0 0 ${size}px`,
        height: size,
        placeItems: "center",
        width: size,
      }}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.56) }} />
    </Box>
  );
}

function SectionHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <Stack
      alignItems={{ xs: "stretch", md: "flex-start" }}
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      spacing={1.5}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography
          color="primary.main"
          fontWeight={850}
          letterSpacing="0.08em"
          textTransform="uppercase"
          variant="caption"
        >
          {eyebrow}
        </Typography>
        <Typography
          component="h2"
          fontWeight={950}
          letterSpacing="-0.04em"
          variant="h4"
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
          {description}
        </Typography>
      </Stack>
      {action}
    </Stack>
  );
}

function ReportsHeroPrototype() {
  return (
    <Surface
      sx={{
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
            theme.palette.info.main,
            0.09,
          )} 46%, ${theme.palette.background.paper} 100%)`,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
      }}
    >
      <Stack spacing={2.2}>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip color="primary" label="Reportes" />
          <Chip label="ADMIN" variant="outlined" />
          <Chip label="PDF controlado" variant="outlined" />
          <Chip label="Ventas · Devoluciones · Merma" variant="outlined" />
        </Stack>

        <Stack
          alignItems={{ xs: "stretch", lg: "center" }}
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          spacing={2.5}
        >
          <Stack direction="row" spacing={1.6} sx={{ minWidth: 0 }}>
            <IconTile icon={AssessmentOutlinedIcon} size={58} tone="primary" />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                fontWeight={950}
                letterSpacing="-0.05em"
                variant="h3"
              >
                Centro de reportes
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                Una vista ejecutiva para revisar venta neta, utilidad, merma, vendedores y productos
                sin saturar la pantalla. El PDF queda como salida final después de consultar datos reales.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(2, minmax(128px, 1fr))",
              },
              minWidth: { lg: 360 },
            }}
          >
            <HeroMiniStat icon={PeopleAltOutlinedIcon} label="Vendedores" value="3" />
            <HeroMiniStat icon={Inventory2OutlinedIcon} label="Productos" value="18" />
            <HeroMiniStat icon={LocalAtmOutlinedIcon} label="Cobros" value="$19.2k" />
            <HeroMiniStat icon={AssignmentReturnOutlinedIcon} label="Devuelto" value="$860" />
          </Box>
        </Stack>
      </Stack>
    </Surface>
  );
}

function HeroMiniStat({
  icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.74),
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        minWidth: 0,
        p: 1.25,
      }}
    >
      <Stack alignItems="center" direction="row" spacing={0.9}>
        <IconTile icon={icon} size={30} tone="primary" />
        <Typography color="text.secondary" fontSize={12} fontWeight={850}>
          {label}
        </Typography>
      </Stack>
      <Typography fontSize={18} fontWeight={950} sx={{ mt: 0.7 }}>
        {value}
      </Typography>
    </Box>
  );
}

function ReportsControlPrototype() {
  return (
    <Surface>
      <Stack spacing={1.7}>
        <SectionHeader
          action={
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {["Hoy", "7 días", "Mes", "Mes anterior"].map((label) => (
                <Chip clickable key={label} label={label} variant={label === "Mes" ? "filled" : "outlined"} />
              ))}
            </Stack>
          }
          description="Los filtros se colocan antes del análisis para evitar PDFs con datos viejos. La búsqueda local aparece después de consultar."
          eyebrow="Consulta"
          title="Periodo y salida del reporte"
        />

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "150px 150px minmax(190px, 1fr) 160px",
            },
          }}
        >
          <TextField
            InputLabelProps={{ shrink: true }}
            label="Desde"
            size="small"
            type="date"
            defaultValue="2026-06-01"
          />
          <TextField
            InputLabelProps={{ shrink: true }}
            label="Hasta"
            size="small"
            type="date"
            defaultValue="2026-06-10"
          />
          <Button
            fullWidth
            startIcon={<CalendarMonthOutlinedIcon />}
            sx={{ minHeight: 40 }}
            variant="contained"
          >
            Consultar reporte
          </Button>
          <Button
            fullWidth
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{ minHeight: 40 }}
            variant="outlined"
          >
            Descargar PDF
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(260px, 1fr) auto",
            },
          }}
        >
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            label="Buscar en resultados"
            placeholder="Folio, vendedor, producto..."
            size="small"
          />
          <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
            <Chip color="success" label="Datos consultados" size="small" />
            <Chip label="Periodo: 01 jun al 10 jun" size="small" variant="outlined" />
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function MetricCard({ metric }: { metric: ReportMetric }) {
  return (
    <Box
      data-testid={`ui-lab-report-metric-${metric.label.toLowerCase().replaceAll(" ", "-")}`}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        height: "100%",
        minWidth: 0,
        p: 1.45,
      }}
    >
      <Stack spacing={1.15}>
        <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
          <Typography color="text.secondary" fontSize={12} fontWeight={850}>
            {metric.label}
          </Typography>
          <IconTile icon={metric.icon} size={32} tone={metric.tone} />
        </Stack>
        <Typography
          color={`${metric.tone}.main`}
          fontSize={{ xs: 23, md: 27 }}
          fontWeight={950}
          letterSpacing="-0.04em"
          sx={{ overflowWrap: "anywhere" }}
        >
          {metric.value}
        </Typography>
        <Typography color="text.secondary" fontSize={12.5}>
          {metric.helper}
        </Typography>
      </Stack>
    </Box>
  );
}

function ExecutiveSummaryPrototype() {
  return (
    <Surface>
      <Stack spacing={1.7}>
        <SectionHeader
          description="Primero se muestran métricas accionables: resultado real, utilidad, pérdidas y devoluciones. Evita repetir tablas si el ADMIN solo necesita saber qué pasó."
          eyebrow="Resumen"
          title="Lectura ejecutiva"
        />

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {reportMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </Box>

        <Box
          sx={{
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette.warning.main, 0.24),
            borderRadius: 3,
            p: 1.4,
          }}
        >
          <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <IconTile icon={WarningAmberOutlinedIcon} size={38} tone="warning" />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900}>Atención del periodo</Typography>
              <Typography color="text.secondary" variant="body2">
                La merma se concentra en 2 productos y un vendedor tiene devoluciones por encima del promedio. Conviene revisar detalle antes de descargar PDF.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function FinancialBridgePrototype() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Muestra cómo se transforma la venta bruta en utilidad operativa. Es más transferible a la app real que una gráfica compleja y funciona bien en móvil."
          eyebrow="Resultado"
          title="Puente financiero"
        />

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
          }}
        >
          {bridgeRows.map((row, index) => (
            <Box
              key={row.label}
              sx={{
                bgcolor: (theme) => alpha(theme.palette[row.tone].main, row.amount < 0 ? 0.08 : 0.1),
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette[row.tone].main, 0.22),
                borderRadius: 2.6,
                p: 1.25,
              }}
            >
              <Stack spacing={0.75}>
                <Chip color={row.tone} label={`${index + 1}. ${row.amount < 0 ? "Resta" : "Resultado"}`} size="small" variant="outlined" />
                <Typography fontSize={13} fontWeight={900}>
                  {row.label}
                </Typography>
                <Typography color={`${row.tone}.main`} fontSize={20} fontWeight={950}>
                  {formatCurrency(row.amount)}
                </Typography>
                <Typography color="text.secondary" fontSize={12}>
                  {row.detail}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </Surface>
  );
}

function TrendPanel() {
  const points = useMemo(() => {
    return dailyTrend
      .map((value, index) => {
        const x = dailyTrend.length === 1 ? 50 : (index / (dailyTrend.length - 1)) * 100;
        const y = 42 - value * 34;

        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, []);

  return (
    <Surface sx={{ height: "100%" }}>
      <Stack spacing={1.5}>
        <SectionHeader
          description="La tendencia diaria ayuda a detectar días atípicos antes de revisar tablas."
          eyebrow="Tendencia"
          title="Venta neta diaria"
        />
        <Box
          component="svg"
          role="img"
          aria-label="Tendencia diaria de venta neta"
          viewBox="0 0 100 46"
          sx={{
            color: "success.main",
            height: { xs: 150, md: 182 },
            overflow: "visible",
            width: "100%",
          }}
        >
          <line opacity="0.24" stroke="currentColor" strokeWidth="0.7" x1="0" x2="100" y1="42" y2="42" />
          <polyline
            fill="none"
            points={points}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.3"
          />
          {dailyTrend.map((value, index) => {
            const x = dailyTrend.length === 1 ? 50 : (index / (dailyTrend.length - 1)) * 100;
            const y = 42 - value * 34;

            return <circle cx={x} cy={y} fill="currentColor" key={index} r="2.2" />;
          })}
        </Box>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {["Lun $1.8k", "Mar $3.1k", "Mié $2.4k", "Jue $5.6k", "Vie $4.8k", "Sáb $7.2k", "Dom $6.6k"].map((label) => (
            <Chip key={label} label={label} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function SellerRankingPanel() {
  const maxValue = Math.max(...sellerRows.map((row) => row.net));

  return (
    <Surface sx={{ height: "100%" }}>
      <Stack spacing={1.5}>
        <SectionHeader
          description="Ranking por venta neta, manteniendo devoluciones visibles sin castigar visualmente al vendedor."
          eyebrow="Equipo"
          title="Vendedores"
        />

        {sellerRows.map((seller) => {
          const width = `${Math.max(8, (seller.net / maxValue) * 100)}%`;

          return (
            <Box key={seller.name}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize={14} fontWeight={900} noWrap>
                    {seller.name}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12}>
                    {seller.sales} ventas · {formatCurrency(seller.returns)} devuelto
                  </Typography>
                </Box>
                <Typography fontSize={14} fontWeight={950}>
                  {formatCurrency(seller.net)}
                </Typography>
              </Stack>
              <Box
                aria-hidden="true"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 999,
                  height: 8,
                  mt: 0.8,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ bgcolor: "primary.main", height: "100%", width }} />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Surface>
  );
}

function ProductPerformancePanel() {
  return (
    <Surface>
      <Stack spacing={1.5}>
        <SectionHeader
          description="Productos que explican movimiento, venta y margen. Esta sección reemplaza tablas largas por filas compactas."
          eyebrow="Catálogo"
          title="Productos destacados"
        />

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {productRows.map((product, index) => (
            <Box
              key={product.sku}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 1.35,
              }}
            >
              <Stack spacing={1}>
                <Stack alignItems="center" direction="row" justifyContent="space-between">
                  <Chip label={`#${index + 1}`} size="small" variant="outlined" />
                  <Chip color={product.margin >= 38 ? "success" : "warning"} label={`${product.margin}% margen`} size="small" />
                </Stack>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={950} noWrap title={product.name}>
                    {product.name}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12} noWrap>
                    {product.sku}
                  </Typography>
                </Box>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" fontSize={12} fontWeight={800}>
                      Unidades
                    </Typography>
                    <Typography fontWeight={950}>{product.units}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography color="text.secondary" fontSize={12} fontWeight={800}>
                      Venta neta
                    </Typography>
                    <Typography fontWeight={950}>{formatCurrency(product.net)}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </Surface>
  );
}

function TimelinePanel() {
  return (
    <Surface>
      <Stack spacing={1.5}>
        <SectionHeader
          action={
            <TextField defaultValue={5} label="Por página" select size="small" sx={{ minWidth: 112 }}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
            </TextField>
          }
          description="Historial resumido para validar folios recientes, vendedor y estado sin abrir otra pantalla."
          eyebrow="Operación"
          title="Movimientos recientes"
        />

        <Stack spacing={1}>
          {timelineRows.map((row) => (
            <Box
              key={row.folio}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                p: 1.2,
              }}
            >
              <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Stack direction="row" spacing={1.1}>
                  <IconTile icon={ReceiptLongOutlinedIcon} size={34} tone={row.status === "Devuelta" ? "warning" : "success"} />
                  <Box>
                    <Typography fontWeight={950}>{row.folio}</Typography>
                    <Typography color="text.secondary" fontSize={12}>
                      {row.seller} · {row.time}
                    </Typography>
                  </Box>
                </Stack>
                <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                  <Chip color={row.status === "Devuelta" ? "warning" : "success"} label={row.status} size="small" />
                  <Typography fontWeight={950} sx={{ mt: 0.4 }}>
                    {formatCurrency(row.amount)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function ReportsWorkspacePrototype() {
  const [activeSection, setActiveSection] = useState<"resumen" | "vendedores" | "productos" | "historial">("resumen");

  const sectionLabel = {
    historial: "Historial",
    productos: "Productos",
    resumen: "Resumen",
    vendedores: "Vendedores",
  }[activeSection];

  return (
    <Surface>
      <Stack spacing={1.7}>
        <SectionHeader
          action={
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {[
                ["resumen", "Resumen"],
                ["vendedores", "Vendedores"],
                ["productos", "Productos"],
                ["historial", "Historial"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  onClick={() => setActiveSection(value as typeof activeSection)}
                  size="small"
                  variant={activeSection === value ? "contained" : "outlined"}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          }
          description={`Vista actual: ${sectionLabel}. La app real puede migrarlo como tabs o botones sin cambiar datos.`}
          eyebrow="Detalle"
          title="Análisis operativo"
        />

        {activeSection === "resumen" && (
          <Box
            sx={{
              display: "grid",
              gap: 1.4,
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
              },
            }}
          >
            <TrendPanel />
            <SellerRankingPanel />
          </Box>
        )}

        {activeSection === "vendedores" && <SellerRankingPanel />}
        {activeSection === "productos" && <ProductPerformancePanel />}
        {activeSection === "historial" && <TimelinePanel />}
      </Stack>
    </Surface>
  );
}

function MobileReportsPreview() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="En móvil se prioriza consultar periodo, ver métricas críticas y abrir detalle bajo demanda."
          eyebrow="Responsive"
          title="Vista móvil 390 × 844"
        />

        <Box
          sx={{
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            maxWidth: 390,
            mx: "auto",
            overflow: "hidden",
            p: 1.2,
          }}
        >
          <Stack spacing={1.1}>
            <Stack direction="row" spacing={1}>
              <IconTile icon={AssessmentOutlinedIcon} size={38} tone="primary" />
              <Box>
                <Typography fontSize={18} fontWeight={950}>
                  Reportes
                </Typography>
                <Typography color="text.secondary" fontSize={12}>
                  01 jun al 10 jun
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 0.8,
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              {reportMetrics.slice(0, 4).map((metric) => (
                <Box
                  key={metric.label}
                  sx={{
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    p: 1,
                  }}
                >
                  <Typography color="text.secondary" fontSize={11} fontWeight={850}>
                    {metric.label}
                  </Typography>
                  <Typography color={`${metric.tone}.main`} fontSize={15} fontWeight={950}>
                    {metric.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button fullWidth size="small" startIcon={<CalendarMonthOutlinedIcon />} variant="contained">
              Consultar
            </Button>

            <Box
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 1,
              }}
            >
              <Typography fontSize={13} fontWeight={950}>
                Puente financiero
              </Typography>
              <Stack spacing={0.7} sx={{ mt: 1 }}>
                {bridgeRows.slice(0, 4).map((row) => (
                  <Stack direction="row" justifyContent="space-between" key={row.label}>
                    <Typography color="text.secondary" fontSize={11.5}>
                      {row.label}
                    </Typography>
                    <Typography color={`${row.tone}.main`} fontSize={11.5} fontWeight={900}>
                      {formatCurrency(row.amount)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function DesignTokenSummary() {
  const tokens = [
    ["Control superior", "Periodo + PDF"],
    ["Primer vistazo", "4 métricas críticas"],
    ["Gráfica principal", "Puente financiero"],
    ["Detalle", "Secciones elegibles"],
  ];

  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Estos criterios reducen el riesgo de que el prototipo no se pueda migrar: mismos datos de la página real, controles equivalentes y visualizaciones hechas con MUI/SVG."
          eyebrow="Tokens"
          title="Medidas para migración"
        />
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {tokens.map(([label, value]) => (
            <Box
              key={label}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                px: 1.3,
                py: 1.05,
              }}
            >
              <Typography color="text.secondary" fontSize={12} fontWeight={750}>
                {label}
              </Typography>
              <Typography fontSize={15} fontWeight={900}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Surface>
  );
}

function ReportsEditablePrototype() {
  return (
    <Stack spacing={2}>
      <ReportsHeroPrototype />
      <ReportsControlPrototype />
      <ExecutiveSummaryPrototype />
      <FinancialBridgePrototype />
      <ReportsWorkspacePrototype />
      <ProductPerformancePanel />
      <MobileReportsPreview />
      <DesignTokenSummary />
    </Stack>
  );
}

export function UiLabPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 34%), #070f1d"
            : "radial-gradient(circle at top left, rgba(59, 130, 246, 0.1), transparent 34%), #f6f8fb",
        minHeight: "100vh",
        px: {
          xs: `${pvVisualTokens.layout.mobileContentPadding}px`,
          sm: `${pvVisualTokens.layout.tabletContentPadding}px`,
          lg: `${pvVisualTokens.layout.desktopContentPadding}px`,
        },
        py: { xs: 3, md: 4 },
      }}
    >
      <Stack
        spacing={2.4}
        sx={{ maxWidth: pvVisualTokens.layout.pageMaxWidth, mx: "auto" }}
      >
        <Surface>
          <Stack spacing={1.25}>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip color="primary" label="UI Lab" />
              <Chip label="Reportes" variant="outlined" />
              <Chip label="No toca backend" variant="outlined" />
              <Chip label="Diseño migrable" variant="outlined" />
              <Chip label="Dev-only" variant="outlined" />
            </Stack>
            <SectionHeader
              description="Prototipo ejecutable para revisar Reportes antes de tocar la página real. Se basa en dashboards de ventas: filtro de periodo primero, métricas ejecutivas, visualización de resultado y detalle bajo demanda."
              eyebrow="Punta Venta"
              title="Laboratorio visual de Reportes"
            />
          </Stack>
        </Surface>

        <ReportsEditablePrototype />
      </Stack>
    </Box>
  );
}
