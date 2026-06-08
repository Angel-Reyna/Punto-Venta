import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  EmptyText,
  ReportPanel,
  formatMoney,
  type OperationsReport
} from "./reportShared";

type ChartTone = "primary" | "success" | "warning" | "error" | "info";

type ChartItem = {
  id: string;
  label: string;
  value: number;
  helper?: string;
};

type BridgeStep = ChartItem & {
  kind: "positive" | "negative" | "result";
};

export function ReportsChartsGrid({ data }: { data: OperationsReport }) {
  const shrinkageCost = data.inventory?.shrinkage.totalCost ?? data.sales.profit.shrinkageCost ?? 0;
  const operatingProfit = data.sales.profit.operatingProfit ?? data.sales.profit.netProfit - shrinkageCost;
  const netCost = data.sales.net - data.sales.profit.netProfit;

  const bridgeSteps: BridgeStep[] = [
    {
      id: "gross-sales",
      label: "Venta bruta",
      value: data.sales.gross,
      helper: "Antes de devoluciones.",
      kind: "positive"
    },
    {
      id: "refunds",
      label: "Devoluciones",
      value: -data.sales.refunded,
      helper: "Monto regresado al cliente.",
      kind: "negative"
    },
    {
      id: "net-sales",
      label: "Venta neta",
      value: data.sales.net,
      helper: "Base real del periodo.",
      kind: "result"
    },
    {
      id: "net-cost",
      label: "Costo neto",
      value: -netCost,
      helper: "Costo histórico vendido.",
      kind: "negative"
    },
    {
      id: "profit-before-shrinkage",
      label: "Utilidad antes de merma",
      value: data.sales.profit.netProfit,
      helper: "Resultado comercial.",
      kind: "result"
    },
    {
      id: "shrinkage",
      label: "Merma",
      value: -shrinkageCost,
      helper: "Caducidad registrada.",
      kind: "negative"
    },
    {
      id: "operating-profit",
      label: "Utilidad operativa",
      value: operatingProfit,
      helper: "Resultado después de merma.",
      kind: "result"
    }
  ];

  const dailyNetSales = (data.sales.daily ?? []).map((day) => ({
    id: day.date,
    label: formatChartDate(day.date),
    value: day.net,
    helper: `${day.count} venta(s) · ${day.units} unidad(es)`
  }));

  const sellerNetSales = data.sales.bySeller
    .map((item) => ({
      id: item.seller.id,
      label: item.seller.name,
      value: item.net,
      helper: `${item.count} venta(s)`
    }))
    .sort((a, b) => b.value - a.value);

  const shrinkageByProduct = (data.inventory?.shrinkage.byProduct ?? [])
    .map((item) => ({
      id: item.product.id,
      label: item.product.name,
      value: item.cost,
      helper: `${item.quantity} unidad(es) caducada(s)`
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12}>
        <ProfitBridgePanel steps={bridgeSteps} />
      </Grid>

      <Grid item xs={12} lg={7}>
        <LineTrendPanel
          emptyText="Sin venta neta diaria para graficar."
          formatValue={formatMoney}
          items={dailyNetSales}
          subtitle="Cambio de la venta neta por día dentro del rango consultado."
          testId="reports-chart-daily-net-sales"
          title="Tendencia diaria de venta neta"
          tone="success"
        />
      </Grid>

      <Grid item xs={12} lg={5}>
        <DotPlotPanel
          emptyText="Sin vendedores con venta neta en el periodo."
          formatValue={formatMoney}
          items={sellerNetSales}
          subtitle="Ranking por posición; evita barras pesadas cuando hay pocos vendedores."
          testId="reports-chart-seller-dot-plot"
          title="Venta neta por vendedor"
          tone="primary"
        />
      </Grid>

      <Grid item xs={12}>
        <ParetoPanel
          emptyText="Sin merma por caducidad en el periodo."
          formatValue={formatMoney}
          items={shrinkageByProduct}
          subtitle="Productos ordenados por costo perdido y porcentaje acumulado de la merma."
          testId="reports-chart-shrinkage-pareto"
          title="Pareto de merma por producto"
          tone="error"
        />
      </Grid>
    </Grid>
  );
}

function ProfitBridgePanel({ steps }: { steps: BridgeStep[] }) {
  return (
    <Box data-testid="reports-chart-profit-bridge">
      <ReportPanel
        title="Puente financiero"
        subtitle="De venta bruta a utilidad operativa, mostrando qué resta valor en el periodo."
      >
        <Grid container spacing={1.25}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={step.id}>
              <BridgeStepCard index={index} step={step} />
            </Grid>
          ))}
        </Grid>
      </ReportPanel>
    </Box>
  );
}

function BridgeStepCard({ index, step }: { index: number; step: BridgeStep }) {
  const tone = bridgeTone(step);
  const prefix = step.kind === "negative" ? "Resta" : step.kind === "result" ? "Resultado" : "Suma";

  return (
    <Box
      sx={{
        height: "100%",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        bgcolor: (theme) => alpha(theme.palette[tone].main, step.kind === "result" ? 0.11 : 0.06)
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Chip size="small" label={`${index + 1}. ${prefix}`} color={tone} variant="outlined" />
        </Stack>
        <Typography variant="body2" fontWeight={900}>
          {step.label}
        </Typography>
        <Typography variant="h6" fontWeight={950} color={`${tone}.main`}>
          {formatMoney(step.value)}
        </Typography>
        {step.helper && (
          <Typography variant="caption" color="text.secondary">
            {step.helper}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function LineTrendPanel({
  emptyText,
  formatValue,
  items,
  subtitle,
  testId,
  title,
  tone
}: {
  emptyText: string;
  formatValue: (value: number) => string;
  items: ChartItem[];
  subtitle: string;
  testId: string;
  title: string;
  tone: ChartTone;
}) {
  const values = items.map((item) => item.value);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(maxValue - minValue, 1);
  const coords = items.map((item, index) => {
    const x = items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
    const y = 40 - ((item.value - minValue) / range) * 34;

    return { ...item, x, y };
  });
  const points = coords.map((coord) => `${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(" ");
  const baselineY = 40 - ((0 - minValue) / range) * 34;

  return (
    <Box data-testid={testId} sx={{ height: "100%" }}>
      <ReportPanel title={title} subtitle={subtitle}>
        {coords.length === 0 ? (
          <EmptyText>{emptyText}</EmptyText>
        ) : (
          <Stack spacing={1.5}>
            <Box
              component="svg"
              viewBox="0 0 100 44"
              role="img"
              aria-label={title}
              sx={{
                width: "100%",
                height: { xs: 150, sm: 180 },
                color: `${tone}.main`,
                overflow: "visible"
              }}
            >
              <line x1="0" x2="100" y1={baselineY} y2={baselineY} stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
              <polyline
                fill="none"
                points={points}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              />
              {coords.map((coord) => (
                <circle key={coord.id} cx={coord.x} cy={coord.y} fill="currentColor" r="2.1" />
              ))}
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {coords.map((coord) => (
                <Chip
                  key={coord.id}
                  label={`${coord.label}: ${formatValue(coord.value)}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Stack>
        )}
      </ReportPanel>
    </Box>
  );
}

function DotPlotPanel({
  emptyText,
  formatValue,
  items,
  subtitle,
  testId,
  title,
  tone
}: {
  emptyText: string;
  formatValue: (value: number) => string;
  items: ChartItem[];
  subtitle: string;
  testId: string;
  title: string;
  tone: ChartTone;
}) {
  const visibleItems = items.slice(0, 6);
  const maxValue = Math.max(...visibleItems.map((item) => item.value), 0);

  return (
    <Box data-testid={testId} sx={{ height: "100%" }}>
      <ReportPanel title={title} subtitle={subtitle}>
        {visibleItems.length === 0 ? (
          <EmptyText>{emptyText}</EmptyText>
        ) : (
          <Stack spacing={1.5}>
            {visibleItems.map((item) => (
              <DotPlotRow key={item.id} formatValue={formatValue} item={item} maxValue={maxValue} tone={tone} />
            ))}
          </Stack>
        )}
      </ReportPanel>
    </Box>
  );
}

function DotPlotRow({
  formatValue,
  item,
  maxValue,
  tone
}: {
  formatValue: (value: number) => string;
  item: ChartItem;
  maxValue: number;
  tone: ChartTone;
}) {
  const position = maxValue <= 0 ? 0 : Math.max(0, Math.min(100, (item.value / maxValue) * 100));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" gap={1} alignItems="baseline">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={800} noWrap title={item.label}>
            {item.label}
          </Typography>
          {item.helper && (
            <Typography variant="caption" color="text.secondary" display="block" noWrap title={item.helper}>
              {item.helper}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" fontWeight={900} whiteSpace="nowrap">
          {formatValue(item.value)}
        </Typography>
      </Stack>
      <Box
        aria-hidden="true"
        sx={{
          mt: 1,
          position: "relative",
          height: 18,
          borderBottom: 1,
          borderColor: (theme) => alpha(theme.palette[tone].main, 0.32)
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: `calc(${position}% - 6px)`,
            bottom: -6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: `${tone}.main`,
            boxShadow: (theme) => `0 0 0 5px ${alpha(theme.palette[tone].main, 0.12)}`
          }}
        />
      </Box>
    </Box>
  );
}

function ParetoPanel({
  emptyText,
  formatValue,
  items,
  subtitle,
  testId,
  title,
  tone
}: {
  emptyText: string;
  formatValue: (value: number) => string;
  items: ChartItem[];
  subtitle: string;
  testId: string;
  title: string;
  tone: ChartTone;
}) {
  const visibleItems = items.slice(0, 6);
  const total = visibleItems.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  let cumulative = 0;

  return (
    <Box data-testid={testId}>
      <ReportPanel title={title} subtitle={subtitle}>
        {visibleItems.length === 0 ? (
          <EmptyText>{emptyText}</EmptyText>
        ) : (
          <Stack spacing={1.25}>
            {visibleItems.map((item, index) => {
              const share = total <= 0 ? 0 : (Math.max(0, item.value) / total) * 100;
              cumulative += share;

              return (
                <ParetoRow
                  cumulative={cumulative}
                  formatValue={formatValue}
                  index={index}
                  item={item}
                  key={item.id}
                  share={share}
                  tone={tone}
                />
              );
            })}
          </Stack>
        )}
      </ReportPanel>
    </Box>
  );
}

function ParetoRow({
  cumulative,
  formatValue,
  index,
  item,
  share,
  tone
}: {
  cumulative: number;
  formatValue: (value: number) => string;
  index: number;
  item: ChartItem;
  share: number;
  tone: ChartTone;
}) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} justifyContent="space-between" alignItems={{ sm: "center" }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Chip color={tone} label={`#${index + 1}`} size="small" variant="outlined" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={900} noWrap title={item.label}>
              {item.label}
            </Typography>
            {item.helper && (
              <Typography variant="caption" color="text.secondary" display="block" noWrap title={item.helper}>
                {item.helper}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip label={formatValue(item.value)} size="small" />
          <Chip label={`${share.toFixed(1)}% del costo`} size="small" variant="outlined" />
          <Chip label={`${Math.min(cumulative, 100).toFixed(1)}% acumulado`} size="small" variant="outlined" />
        </Stack>
      </Stack>
    </Box>
  );
}

function bridgeTone(step: BridgeStep): ChartTone {
  if (step.kind === "negative") {
    return "error";
  }

  if (step.kind === "result") {
    return step.value < 0 ? "warning" : "success";
  }

  return "primary";
}

function formatChartDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short"
  });
}
