import type { ElementType, ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  alpha,
  type SxProps,
  type Theme,
  useTheme,
} from "@mui/material/styles";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { pvVisualTokens } from "../../design-lab/pvVisualTokens";

type Tone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type ExecutiveMetric = {
  action: string;
  helper: string;
  icon: ElementType;
  label: string;
  tone: Tone;
  value: string;
};

type AlertItem = {
  action: string;
  detail: string;
  label: string;
  severity: "critical" | "warning" | "info";
  value: string;
};

type SellerSignal = {
  name: string;
  sales: number;
  total: number;
  trend: string;
};

type RecentSale = {
  folio: string;
  seller: string;
  status: string;
  time: string;
  total: number;
};

const executiveMetrics: ExecutiveMetric[] = [
  {
    action: "Ver reportes",
    helper: "Venta registrada hoy por todos los vendedores.",
    icon: LocalAtmOutlinedIcon,
    label: "Ventas de hoy",
    tone: "success",
    value: "$8,940.00",
  },
  {
    action: "Revisar ajuste",
    helper: "Devolución o cancelación esperando autorización del admin.",
    icon: ReceiptLongOutlinedIcon,
    label: "Ajuste pendiente",
    tone: "info",
    value: "1",
  },
  {
    action: "Revisar inventario",
    helper: "Productos en mínimo o agotados.",
    icon: WarningAmberOutlinedIcon,
    label: "Atención stock",
    tone: "warning",
    value: "9",
  },
  {
    action: "Ver merma",
    helper: "Pérdida registrada por caducidad hoy.",
    icon: DeleteSweepOutlinedIcon,
    label: "Merma hoy",
    tone: "error",
    value: "$412.00",
  },
];

const attentionItems: AlertItem[] = [
  {
    action: "Reponer",
    detail: "Agua Mineral 1 L quedó debajo del mínimo en Principal.",
    label: "Stock bajo",
    severity: "warning",
    value: "4 / mínimo 10",
  },
  {
    action: "Resolver",
    detail: "Galleta vainilla paquete no tiene unidades disponibles.",
    label: "Sin stock",
    severity: "critical",
    value: "0 unidades",
  },
  {
    action: "Revisar",
    detail: "María solicitó devolución de una venta y requiere autorización.",
    label: "Ajuste pendiente",
    severity: "info",
    value: "1 solicitud",
  },
];

const sellerSignals: SellerSignal[] = [
  { name: "Ana López", sales: 18, total: 4120, trend: "+12%" },
  { name: "Carlos Ruiz", sales: 14, total: 3310, trend: "+4%" },
  { name: "María Torres", sales: 9, total: 1510, trend: "-8%" },
];

const recentSales: RecentSale[] = [
  { folio: "PV-000184", seller: "Ana López", status: "Completada", time: "Hoy · 18:42", total: 156 },
  { folio: "PV-000183", seller: "Carlos Ruiz", status: "Completada", time: "Hoy · 17:10", total: 96 },
  { folio: "PV-000182", seller: "María Torres", status: "Devuelta", time: "Hoy · 16:20", total: 68 },
];

const salesTrendDays = [
  { amount: 3240, label: "Lun 03" },
  { amount: 3960, label: "Mar 04" },
  { amount: 3780, label: "Mié 05" },
  { amount: 5580, label: "Jue 06" },
  { amount: 5040, label: "Vie 07" },
  { amount: 7380, label: "Sáb 08" },
  { amount: 6660, label: "Dom 09" },
];

const salesTrendMax = 9000;
const salesTrendGridLines = [9000, 6750, 4500, 2250];

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
  tone = "primary",
}: {
  icon: ElementType;
  tone?: Tone;
}) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        backgroundColor: alpha(toneMain(theme, tone), theme.palette.mode === "dark" ? 0.18 : 0.1),
        border: "1px solid",
        borderColor: alpha(toneMain(theme, tone), theme.palette.mode === "dark" ? 0.38 : 0.22),
        borderRadius: 3,
        color: toneMain(theme, tone),
        display: "flex",
        flexShrink: 0,
        height: 48,
        justifyContent: "center",
        width: 48,
      })}
    >
      <Icon />
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
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      spacing={1.2}
      useFlexGap
    >
      <Stack spacing={0.45}>
        {eyebrow && (
          <Typography color="primary.main" fontSize={12} fontWeight={900} letterSpacing={0.8} textTransform="uppercase">
            {eyebrow}
          </Typography>
        )}
        <Typography fontWeight={950} sx={{ fontSize: { xs: 22, md: 28 }, lineHeight: 1.05 }}>
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ maxWidth: 760 }} variant="body2">
            {description}
          </Typography>
        )}
      </Stack>
      {action}
    </Stack>
  );
}

function ExecutiveMetricCard({ metric }: { metric: ExecutiveMetric }) {
  const Icon = metric.icon;

  return (
    <Surface
      sx={(theme) => ({
        minHeight: 170,
        position: "relative",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          boxShadow: theme.shadows[6],
          transform: "translateY(-2px)",
        },
      })}
    >
      <Box
        sx={(theme) => ({
          color: alpha(toneMain(theme, metric.tone), theme.palette.mode === "dark" ? 0.16 : 0.1),
          position: "absolute",
          right: 14,
          top: 10,
          transform: "rotate(-8deg)",
        })}
      >
        <Icon sx={{ fontSize: 92 }} />
      </Box>
      <Stack spacing={1.4} sx={{ minHeight: 130, position: "relative" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconTile icon={metric.icon} tone={metric.tone} />
          <Chip color={metric.tone === "error" ? "error" : metric.tone === "warning" ? "warning" : "default"} label={metric.action} size="small" />
        </Stack>
        <Box>
          <Typography color="text.secondary" fontSize={12.5} fontWeight={800}>
            {metric.label}
          </Typography>
          <Typography fontWeight={950} sx={{ fontSize: { xs: 28, md: 32 }, lineHeight: 1 }}>
            {metric.value}
          </Typography>
        </Box>
        <Typography color="text.secondary" variant="body2">
          {metric.helper}
        </Typography>
      </Stack>
    </Surface>
  );
}

function DashboardHeroPrototype() {
  return (
    <Surface
      sx={(theme) => ({
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.52)}, ${alpha(theme.palette.background.paper, 0.94)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)}, ${alpha(theme.palette.background.paper, 0.98)})`,
      })}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          useFlexGap
        >
          <Stack direction="row" spacing={1.4}>
            <IconTile icon={DashboardCustomizeOutlinedIcon} />
            <SectionHeader
              description="Resumen operativo para decidir rápido: ventas del día, stock que requiere atención, actividad de vendedores y acciones inmediatas."
              eyebrow="Inicio"
              title="Centro operativo"
            />
          </Stack>

          <Stack
            alignItems={{ xs: "stretch", sm: "center" }}
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
          >
            <Chip label="Actualizado hoy · 18:45" variant="outlined" />
            <Button startIcon={<RefreshOutlinedIcon />} variant="contained">
              Actualizar
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {[
            ["Administradores", "2 activos", AdminPanelSettingsOutlinedIcon, "info" as Tone],
            ["Vendedores", "6 activos", StorefrontOutlinedIcon, "success" as Tone],
            ["Estado general", "3 alertas", ReportProblemOutlinedIcon, "warning" as Tone],
          ].map(([label, value, icon, tone]) => {
            const Icon = icon as ElementType;

            return (
              <Box
                key={label as string}
                sx={(theme) => ({
                  alignItems: "center",
                  backgroundColor: alpha(toneMain(theme, tone as Tone), theme.palette.mode === "dark" ? 0.12 : 0.06),
                  border: "1px solid",
                  borderColor: alpha(toneMain(theme, tone as Tone), theme.palette.mode === "dark" ? 0.3 : 0.18),
                  borderRadius: 3,
                  display: "flex",
                  gap: 1,
                  px: 1.25,
                  py: 1.1,
                })}
              >
                <Icon sx={{ color: (theme: Parameters<typeof toneMain>[0]) => toneMain(theme, tone as Tone) }} />
                <Box>
                  <Typography color="text.secondary" fontSize={12} fontWeight={800}>
                    {label as string}
                  </Typography>
                  <Typography fontWeight={950}>{value as string}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Surface>
  );
}

function ExecutiveSummaryPrototype() {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.4,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {executiveMetrics.map((metric) => (
        <ExecutiveMetricCard key={metric.label} metric={metric} />
      ))}
    </Box>
  );
}

function ActionCard({
  description,
  icon,
  label,
  tone,
}: {
  description: string;
  icon: ElementType;
  label: string;
  tone: Tone;
}) {
  const Icon = icon;

  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        backgroundColor: alpha(toneMain(theme, tone), theme.palette.mode === "dark" ? 0.12 : 0.055),
        border: "1px solid",
        borderColor: alpha(toneMain(theme, tone), theme.palette.mode === "dark" ? 0.32 : 0.18),
        borderRadius: 3,
        cursor: "pointer",
        display: "flex",
        gap: 1.2,
        p: 1.25,
        transition: "transform 160ms ease, background-color 160ms ease",
        "&:hover": {
          backgroundColor: alpha(toneMain(theme, tone), theme.palette.mode === "dark" ? 0.18 : 0.09),
          transform: "translateY(-1px)",
        },
      })}
    >
      <IconTile icon={Icon} tone={tone} />
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={900}>{label}</Typography>
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
      </Box>
      <ArrowForwardOutlinedIcon sx={{ ml: "auto", color: "text.secondary" }} />
    </Box>
  );
}

function CommandCenterPrototype() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Acciones directas desde Inicio. La tarjeta no solo informa: lleva al módulo donde se resuelve el pendiente."
          eyebrow="Acciones"
          title="Qué hacer ahora"
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <ActionCard
            description="Registrar una venta con stock asignado, sin caja obligatoria."
            icon={PointOfSaleOutlinedIcon}
            label="Nueva venta"
            tone="success"
          />
          <ActionCard
            description="Ver productos sin stock o debajo del mínimo."
            icon={Inventory2OutlinedIcon}
            label="Revisar inventario"
            tone="warning"
          />
          <ActionCard
            description="Consultar ventas, utilidad, merma y devoluciones."
            icon={TimelineOutlinedIcon}
            label="Abrir reportes"
            tone="primary"
          />
          <ActionCard
            description="Gestionar vendedores y administradores activos."
            icon={PeopleAltOutlinedIcon}
            label="Ver usuarios"
            tone="info"
          />
        </Box>
      </Stack>
    </Surface>
  );
}

function AttentionPanelPrototype() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Alertas priorizadas. Rojo significa bloqueo operativo; amarillo indica riesgo antes de quedarse sin producto."
          eyebrow="Atención"
          title="Pendientes operativos"
        />
        <Stack spacing={1}>
          {attentionItems.map((item) => (
            <Box
              key={`${item.label}-${item.detail}`}
              sx={(theme) => {
                const tone: Tone = item.severity === "critical" ? "error" : item.severity === "warning" ? "warning" : "info";

                return {
                  border: "1px solid",
                  borderColor: alpha(toneMain(theme, tone), theme.palette.mode === "dark" ? 0.34 : 0.2),
                  borderRadius: 3,
                  p: 1.25,
                };
              }}
            >
              <Stack
                alignItems={{ xs: "flex-start", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Stack direction="row" spacing={1.1} sx={{ minWidth: 0 }}>
                  <IconTile
                    icon={item.severity === "critical" ? ReportProblemOutlinedIcon : item.severity === "warning" ? WarningAmberOutlinedIcon : AssignmentTurnedInOutlinedIcon}
                    tone={item.severity === "critical" ? "error" : item.severity === "warning" ? "warning" : "info"}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Typography fontWeight={900}>{item.label}</Typography>
                      <Chip label={item.value} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {item.detail}
                    </Typography>
                  </Box>
                </Stack>
                <Button size="small" variant="outlined">
                  {item.action}
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function SellerPerformancePanel() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Lectura rápida del equipo para detectar quién está vendiendo y quién necesita seguimiento."
          eyebrow="Equipo"
          title="Vendedores activos"
        />
        <Stack spacing={1}>
          {sellerSignals.map((seller) => (
            <Box key={seller.name}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900} noWrap>{seller.name}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {seller.sales} ventas · {formatCurrency(seller.total)}
                  </Typography>
                </Stack>
                <Chip
                  color={seller.trend.startsWith("-") ? "warning" : "success"}
                  icon={
                    seller.trend.startsWith("-") ? (
                      <TrendingDownOutlinedIcon />
                    ) : (
                      <TrendingUpOutlinedIcon />
                    )
                  }
                  label={seller.trend}
                  size="small"
                  sx={{
                    "& .MuiChip-icon": {
                      fontSize: 16,
                    },
                  }}
                  title={seller.trend.startsWith("-") ? "Ventas bajaron frente al periodo anterior" : "Ventas subieron frente al periodo anterior"}
                />
              </Stack>
              <LinearProgress
                value={Math.min(100, Math.round((seller.total / 4500) * 100))}
                variant="determinate"
                sx={{ borderRadius: 999, height: 7, mt: 0.8 }}
              />
            </Box>
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function SalesTrendPanel() {
  const [selectedIndex, setSelectedIndex] = useState(6);
  const selectedDay = salesTrendDays[selectedIndex] ?? salesTrendDays[0];
  const selectedAmount = selectedDay.amount;

  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Tendencia de 7 días con fechas visibles y líneas de referencia detrás de las barras para comparar montos sin saturar la gráfica."
          eyebrow="Tendencia"
          title="Ventas últimos 7 días"
          action={<Chip label={`${selectedDay.label} · ${formatCurrency(selectedAmount)}`} />}
        />
        <Box
          sx={(theme) => ({
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
            px: { xs: 1, sm: 1.5 },
            py: 1.4,
            "&::before": {
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.03)
                  : alpha(theme.palette.common.black, 0.018),
              content: '""',
              inset: 0,
              position: "absolute",
            },
          })}
        >
          <Box
            aria-hidden
            sx={{
              bottom: 42,
              left: { xs: 8, sm: 12 },
              pointerEvents: "none",
              position: "absolute",
              right: { xs: 8, sm: 12 },
              top: 8,
              zIndex: 0,
            }}
          >
            {salesTrendGridLines.map((value, index) => {
              const top = `${(index / (salesTrendGridLines.length - 1)) * 100}%`;

              return (
                <Box
                  key={value}
                  sx={{
                    alignItems: "center",
                    display: "grid",
                    gap: 0.8,
                    gridTemplateColumns: "auto 1fr auto",
                    left: 0,
                    position: "absolute",
                    right: 0,
                    top,
                    transform: "translateY(-50%)",
                  }}
                >
                  <Typography color="text.secondary" fontSize={10} fontWeight={800}>
                    ${Math.round(value / 1000)}k
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      borderTop: "1px solid",
                      borderColor: alpha(theme.palette.text.primary, index % 2 === 0 ? 0.2 : 0.12),
                    })}
                  />
                  <Typography color="text.secondary" fontSize={10} fontWeight={800}>
                    ${Math.round(value / 1000)}k
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              alignItems: "end",
              display: "grid",
              gap: { xs: 0.7, sm: 0.9 },
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              minHeight: 190,
              position: "relative",
              zIndex: 1,
            }}
          >
            {salesTrendDays.map((day, index) => {
              const ratio = day.amount / salesTrendMax;

              return (
                <Box
                  key={day.label}
                  component="button"
                  onClick={() => setSelectedIndex(index)}
                  sx={{
                    appearance: "none",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.7,
                    justifyContent: "end",
                    minWidth: 0,
                    p: 0,
                  }}
                >
                  <Typography color={index === selectedIndex ? "primary.main" : "text.secondary"} fontSize={10} fontWeight={900}>
                    {formatCurrency(day.amount).replace(".00", "")}
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      alignSelf: "center",
                      background:
                        index === selectedIndex
                          ? `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
                          : alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.38 : 0.24),
                      border: "1px solid",
                      borderColor:
                        index === selectedIndex
                          ? alpha(theme.palette.primary.main, 0.52)
                          : alpha(theme.palette.primary.main, 0.16),
                      borderRadius: 1.2,
                      boxShadow:
                        index === selectedIndex
                          ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.22)}`
                          : "none",
                      height: `${Math.max(34, ratio * 138)}px`,
                      position: "relative",
                      transition: "height 160ms ease, opacity 160ms ease",
                      width: { xs: "58%", sm: "52%" },
                      zIndex: 1,
                    })}
                  />
                  <Typography color={index === selectedIndex ? "primary.main" : "text.secondary"} fontSize={{ xs: 9.5, sm: 10.5 }} fontWeight={850} lineHeight={1.1}>
                    {day.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Stack>
    </Surface>
  );
}

function RecentSalesPanel() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Últimos movimientos para saber qué acaba de pasar sin abrir Reportes."
          eyebrow="Actividad"
          title="Ventas recientes"
        />
        <Stack divider={<Divider flexItem />} spacing={1}>
          {recentSales.map((sale) => (
            <Stack key={sale.folio} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                <Typography fontWeight={900}>{sale.folio}</Typography>
                <Typography color="text.secondary" variant="caption">
                  {sale.seller} · {sale.time}
                </Typography>
              </Stack>
              <Stack alignItems="flex-end" spacing={0.4}>
                <Typography fontWeight={950}>{formatCurrency(sale.total)}</Typography>
                <Chip
                  color={sale.status === "Devuelta" ? "warning" : "success"}
                  label={sale.status}
                  size="small"
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function DashboardWorkspacePrototype() {
  const [section, setSection] = useState("atencion");

  const content = useMemo(() => {
    if (section === "equipo") return <SellerPerformancePanel />;
    if (section === "ventas") return <RecentSalesPanel />;

    return <AttentionPanelPrototype />;
  }, [section]);

  return (
    <Surface>
      <Stack spacing={1.8}>
        <SectionHeader
          description="Detalle elegible para no saturar Inicio. Primero muestra pendientes; luego permite revisar equipo o actividad."
          eyebrow="Operación"
          title="Panel de seguimiento"
          action={
            <ToggleButtonGroup
              exclusive
              onChange={(_, value) => value && setSection(value)}
              size="small"
              value={section}
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: "999px !important",
                  fontWeight: 850,
                  minWidth: { xs: 88, sm: 104 },
                  px: { xs: 1.2, sm: 1.6 },
                },
              }}
            >
              <ToggleButton value="atencion">Atención</ToggleButton>
              <ToggleButton value="equipo">Equipo</ToggleButton>
              <ToggleButton value="ventas">Ventas</ToggleButton>
            </ToggleButtonGroup>
          }
        />
        {content}
      </Stack>
    </Surface>
  );
}

function MobileDashboardPreview() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="En móvil se prioriza vender y resolver alertas; el detalle queda debajo en tarjetas."
          eyebrow="Responsive"
          title="Vista móvil"
        />
        <Box
          sx={(theme) => ({
            backgroundColor: theme.palette.mode === "dark" ? alpha(theme.palette.common.black, 0.36) : "#f7f9fc",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 5,
            mx: "auto",
            maxWidth: 390,
            p: 1.2,
          })}
        >
          <Stack spacing={1.1}>
            <Box
              sx={(theme) => ({
                backgroundColor: theme.palette.background.paper,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
                p: 1.2,
              })}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography fontWeight={950}>Inicio</Typography>
                <Chip label="3 alertas" size="small" color="warning" />
              </Stack>
            </Box>
            {executiveMetrics.slice(0, 2).map((metric) => (
              <Box
                key={metric.label}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 4,
                  p: 1.2,
                }}
              >
                <Typography color="text.secondary" fontSize={12} fontWeight={800}>{metric.label}</Typography>
                <Typography fontSize={24} fontWeight={950}>{metric.value}</Typography>
              </Box>
            ))}
            <ActionCard
              description="Acceso principal para vendedor."
              icon={PointOfSaleOutlinedIcon}
              label="Nueva venta"
              tone="success"
            />
            <AttentionPanelPrototype />
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function DesignTokenSummary() {
  const tokens = [
    ["Primer vistazo", "4 métricas accionables"],
    ["Alertas", "Con acción directa"],
    ["Roles", "Admin y vendedores separados"],
    ["Responsive", "Móvil prioriza vender"],
  ];

  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Criterios para migrar a Dashboard real: mismos datos disponibles, tarjetas clicables, sin caja obligatoria y sin saturar el primer vistazo."
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

function DashboardEditablePrototype() {
  return (
    <Stack spacing={2}>
      <DashboardHeroPrototype />
      <ExecutiveSummaryPrototype />
      <CommandCenterPrototype />
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
        }}
      >
        <DashboardWorkspacePrototype />
        <SalesTrendPanel />
      </Box>
      <MobileDashboardPreview />
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
            ? "radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 34%), #070f1d"
            : "radial-gradient(circle at top left, rgba(34, 197, 94, 0.1), transparent 34%), #f6f8fb",
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
              <Chip label="Inicio / Dashboard" variant="outlined" />
              <Chip label="No toca backend" variant="outlined" />
              <Chip label="Diseño migrable" variant="outlined" />
              <Chip label="Dev-only" variant="outlined" />
            </Stack>
            <SectionHeader
              description="Prototipo ejecutable para revisar Inicio antes de tocar la página real. Se basa en dashboards operativos: decisión rápida, alertas accionables y navegación directa a los módulos relacionados."
              eyebrow="Punta Venta"
              title="Laboratorio visual de Inicio"
            />
          </Stack>
        </Surface>

        <DashboardEditablePrototype />
      </Stack>
    </Box>
  );
}
