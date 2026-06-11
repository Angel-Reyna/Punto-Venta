import { useState, type ReactNode } from "react";

import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  EmptyText,
  ReportPanel,
  formatMoney,
  paymentMethodLabel,
  statusColor,
  statusLabel,
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
      helper: "Total vendido antes de restar reembolsos.",
      kind: "positive"
    },
    {
      id: "refunds",
      label: "Devoluciones",
      value: -data.sales.refunded,
      helper: "Reembolsos que disminuyen la venta real.",
      kind: "negative"
    },
    {
      id: "net-sales",
      label: "Venta neta",
      value: data.sales.net,
      helper: "Lo que realmente quedó vendido después de devoluciones.",
      kind: "result"
    },
    {
      id: "net-cost",
      label: "Costo neto",
      value: -netCost,
      helper: "Costo de los productos que sí quedaron vendidos.",
      kind: "negative"
    },
    {
      id: "profit-before-shrinkage",
      label: "Utilidad antes de merma",
      value: data.sales.profit.netProfit,
      helper: "Venta neta menos costo neto; todavía no descuenta merma.",
      kind: "result"
    },
    {
      id: "shrinkage",
      label: "Merma",
      value: -shrinkageCost,
      helper: "Costo perdido por salidas marcadas como caducidad.",
      kind: "negative"
    },
    {
      id: "operating-profit",
      label: "Utilidad operativa",
      value: operatingProfit,
      helper: "Utilidad final estimada después de descontar costo y merma.",
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

      <Grid item xs={12} lg={8}>
        <ParetoPanel
          emptyText="Sin merma por caducidad en el periodo."
          formatValue={formatMoney}
          items={shrinkageByProduct}
          subtitle="Productos ordenados por el costo perdido por caducidad. Úsalo para detectar qué artículos están generando pérdida en el periodo."
          testId="reports-chart-shrinkage-pareto"
          title="Productos que generan merma"
          tone="error"
        />
      </Grid>

      <Grid item xs={12} lg={4}>
        <StatusAndMethodsPanel data={data} />
      </Grid>
    </Grid>
  );
}

function ProfitBridgePanel({ steps }: { steps: BridgeStep[] }) {
  const maxMagnitude = Math.max(...steps.map((step) => Math.abs(step.value)), 1);

  return (
    <Box data-testid="reports-chart-profit-bridge">
      <ReportPanel
        title="Puente financiero"
        subtitle="Visualiza cómo la venta bruta se convierte en utilidad operativa: cada bloque suma, descuenta o muestra un subtotal."
      >
        <Stack spacing={2}>
          <Box
            sx={{
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
              borderRadius: 2,
              p: 1.25
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Léelo de izquierda a derecha: primero aparece la venta registrada, después se descuentan devoluciones, costo y merma, y al final queda la utilidad operativa estimada.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(7, minmax(0, 1fr))"
              },
              gap: 1.25,
              alignItems: "stretch"
            }}
          >
            {steps.map((step, index) => (
              <WaterfallStep key={step.id} index={index} maxMagnitude={maxMagnitude} step={step} />
            ))}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            divider={<Divider flexItem orientation="vertical" />}
            spacing={1.25}
            sx={{ color: "text.secondary" }}
          >
            <Typography variant="caption">Azul: entrada inicial.</Typography>
            <Typography variant="caption">Rojo: descuentos o pérdidas.</Typography>
            <Typography variant="caption">Verde: subtotal o resultado.</Typography>
          </Stack>
        </Stack>
      </ReportPanel>
    </Box>
  );
}

function WaterfallStep({
  index,
  maxMagnitude,
  step
}: {
  index: number;
  maxMagnitude: number;
  step: BridgeStep;
}) {
  const tone = bridgeTone(step);
  const prefix = bridgeStepPrefix(step, index);
  const barHeight = Math.max(18, (Math.abs(step.value) / maxMagnitude) * 92);

  return (
    <Box
      sx={{
        minHeight: 190,
        border: 1,
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.28),
        borderRadius: 2,
        p: 1.25,
        bgcolor: (theme) => alpha(theme.palette[tone].main, step.kind === "result" ? 0.1 : 0.055),
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <Stack spacing={0.75}>
        <Chip size="small" label={prefix} color={tone} variant="outlined" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="body2" fontWeight={900}>
          {step.label}
        </Typography>
        <Typography variant="h6" fontWeight={950} color={`${tone}.main`}>
          {formatMoney(step.value)}
        </Typography>
      </Stack>

      <Box
        aria-hidden="true"
        sx={{
          height: 108,
          display: "flex",
          alignItems: step.kind === "negative" ? "flex-start" : "flex-end",
          justifyContent: "center",
          py: 0.75
        }}
      >
        <Box
          sx={{
            width: "58%",
            minWidth: 28,
            height: barHeight,
            borderRadius: 1.5,
            bgcolor: `${tone}.main`,
            opacity: 0.9
          }}
        />
      </Box>

      {step.helper && (
        <Typography variant="caption" color="text.secondary">
          {step.helper}
        </Typography>
      )}
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
  const lastPoint = coords[coords.length - 1];
  const [activeId, setActiveId] = useState<string | null>(lastPoint?.id ?? null);
  const activePoint = coords.find((coord) => coord.id === activeId) ?? lastPoint;
  const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const bestPoint = coords.reduce<(typeof coords)[number] | undefined>(
    (best, coord) => (!best || coord.value > best.value ? coord : best),
    undefined
  );

  return (
    <Box data-testid={testId} sx={{ height: "100%" }}>
      <ReportPanel title={title} subtitle={subtitle}>
        {coords.length === 0 ? (
          <EmptyText>{emptyText}</EmptyText>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TrendInsight
                label="Día seleccionado"
                value={activePoint ? `${activePoint.label} · ${formatValue(activePoint.value)}` : "Sin dato"}
              />
              <TrendInsight
                label="Mejor día"
                value={bestPoint ? `${bestPoint.label} · ${formatValue(bestPoint.value)}` : "Sin dato"}
              />
              <TrendInsight label="Promedio diario" value={formatValue(average)} />
            </Stack>

            <Box
              component="svg"
              viewBox="0 0 100 48"
              role="img"
              aria-label={title}
              sx={{
                width: "100%",
                height: { xs: 155, sm: 185 },
                color: `${tone}.main`,
                overflow: "visible"
              }}
            >
              <line x1="0" x2="100" y1={baselineY} y2={baselineY} stroke="currentColor" strokeWidth="0.6" opacity="0.22" />
              <polyline
                fill="none"
                points={points}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              />
              {coords.map((coord) => {
                const isActive = activePoint?.id === coord.id;

                return (
                  <g key={coord.id}>
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      fill="currentColor"
                      onClick={() => setActiveId(coord.id)}
                      onFocus={() => setActiveId(coord.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          setActiveId(coord.id);
                        }
                      }}
                      onMouseEnter={() => setActiveId(coord.id)}
                      r={isActive ? 3.1 : 2.1}
                      role="button"
                      tabIndex={0}
                      aria-label={`${coord.label}: ${formatValue(coord.value)}. ${coord.helper ?? ""}`}
                      style={{ cursor: "pointer" }}
                    />
                    <title>{`${coord.label}: ${formatValue(coord.value)} · ${coord.helper ?? ""}`}</title>
                  </g>
                );
              })}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1="6"
                  y2="42"
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeWidth="0.7"
                  opacity="0.45"
                />
              )}
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {coords.slice(0, 1).map((coord) => (
                <Chip key={coord.id} label={`Inicio: ${coord.label}`} size="small" variant="outlined" />
              ))}
              {activePoint && <Chip color={tone} label={`Seleccionado: ${activePoint.label}`} size="small" variant="outlined" />}
              {coords.slice(-1).map((coord) => (
                <Chip key={coord.id} label={`Cierre: ${coord.label}`} size="small" variant="outlined" />
              ))}
            </Stack>
          </Stack>
        )}
      </ReportPanel>
    </Box>
  );
}

function TrendInsight({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1,
        bgcolor: "background.default"
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={850}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={900} noWrap title={value}>
        {value}
      </Typography>
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
  const visibleItems = items.slice(0, 5);
  const total = visibleItems.reduce((sum, item) => sum + Math.max(0, item.value), 0);

  return (
    <Box data-testid={testId}>
      <ReportPanel title={title} subtitle={subtitle}>
        {visibleItems.length === 0 ? (
          <EmptyText>{emptyText}</EmptyText>
        ) : (
          <Stack spacing={1.25}>
            {visibleItems.map((item, index) => {
              const share = total <= 0 ? 0 : (Math.max(0, item.value) / total) * 100;

              return (
                <ParetoRow
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
  formatValue,
  index,
  item,
  share,
  tone
}: {
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
          <Chip label={`Costo perdido: ${formatValue(item.value)}`} size="small" />
          <Chip label={`${share.toFixed(1)}% del costo de merma`} size="small" variant="outlined" />
        </Stack>
      </Stack>
    </Box>
  );
}


function StatusAndMethodsPanel({ data }: { data: OperationsReport }) {
  return (
    <Box data-testid="reports-chart-status-methods" sx={{ height: "100%" }}>
      <ReportPanel title="Estados y métodos" subtitle="Resume cómo se cerraron las ventas y por qué método entró o salió dinero.">
        <Stack spacing={2}>
          <SummaryChipGroup title="Estado de ventas">
            {Object.entries(data.sales.byStatus).length === 0 ? (
              <EmptyText>Sin ventas.</EmptyText>
            ) : (
              Object.entries(data.sales.byStatus).map(([status, count]) => (
                <Chip key={status} color={statusColor(status)} label={`${statusLabel(status)}: ${count}`} />
              ))
            )}
          </SummaryChipGroup>

          <SummaryChipGroup title="Cobros recibidos">
            {Object.entries(data.sales.paymentSummary).length === 0 ? (
              <EmptyText>Sin cobros registrados.</EmptyText>
            ) : (
              Object.entries(data.sales.paymentSummary).map(([method, amount]) => (
                <Chip
                  key={method}
                  color="primary"
                  variant="outlined"
                  label={`${paymentMethodLabel(method)}: ${formatMoney(amount)}`}
                />
              ))
            )}
          </SummaryChipGroup>

          <SummaryChipGroup title="Devoluciones pagadas">
            {Object.entries(data.returns.byMethod).length === 0 ? (
              <EmptyText>Sin devoluciones registradas.</EmptyText>
            ) : (
              Object.entries(data.returns.byMethod).map(([method, amount]) => (
                <Chip
                  key={method}
                  color="warning"
                  variant="outlined"
                  label={`${paymentMethodLabel(method)}: ${formatMoney(amount)}`}
                />
              ))
            )}
          </SummaryChipGroup>
        </Stack>
      </ReportPanel>
    </Box>
  );
}

function SummaryChipGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" fontWeight={850} mb={1}>
        {title}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {children}
      </Stack>
    </Box>
  );
}

function bridgeStepPrefix(step: BridgeStep, index: number) {
  if (index === 0) {
    return "Punto de partida";
  }

  if (step.kind === "negative") {
    return "Se descuenta";
  }

  if (step.id === "operating-profit") {
    return "Resultado final";
  }

  return "Subtotal";
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
