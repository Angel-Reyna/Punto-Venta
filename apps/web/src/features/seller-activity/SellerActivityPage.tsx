import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";

import { PageHeader } from "../../components/PageHeader";
import { SellerActivityFiltersPanel } from "./SellerActivityFiltersPanel";
import { SellerActivityHero } from "./SellerActivityHero";
import { SellerActivityMetrics } from "./SellerActivityMetrics";
import { SellerActivityOperationalInsights } from "./SellerActivityOperationalInsights";
import { SellerActivitySellerFocus } from "./SellerActivitySellerFocus";
import { SellerActivitySummaryPanel } from "./SellerActivitySummaryPanel";
import { SellerActivityTimeline } from "./SellerActivityTimeline";
import { useSellerActivityData } from "./useSellerActivityData";

import type { ReactNode } from "react";

type SellerActivitySection = "events" | "sellers" | "signals";

type SectionOption = {
  description: string;
  icon: ReactNode;
  label: string;
  metric: string;
  tone: "primary" | "info" | "warning";
  value: SellerActivitySection;
};

function ReviewModeCard({
  isSelected,
  onClick,
  option,
}: {
  isSelected: boolean;
  onClick: () => void;
  option: SectionOption;
}) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        borderColor: isSelected ? theme.palette[option.tone].main : theme.palette.divider,
        bgcolor: isSelected
          ? alpha(theme.palette[option.tone].main, theme.palette.mode === "dark" ? 0.18 : 0.08)
          : alpha(theme.palette.background.paper, 0.96),
        boxShadow: isSelected ? `0 16px 36px ${alpha(theme.palette[option.tone].main, 0.16)}` : "none",
      })}
    >
      <CardActionArea
        aria-pressed={isSelected}
        data-testid={`seller-activity-section-${option.value}`}
        onClick={onClick}
        sx={{ height: "100%", p: 0 }}
      >
        <CardContent sx={{ height: "100%", p: { xs: 1.75, md: 2 } }}>
          <Stack spacing={1.25} height="100%">
            <Stack direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
              <Box
                sx={(theme) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  color: `${option.tone}.main`,
                  bgcolor: alpha(theme.palette[option.tone].main, 0.13),
                  flexShrink: 0,
                })}
              >
                {option.icon}
              </Box>
              <Chip
                size="small"
                color={isSelected ? option.tone : "default"}
                label={isSelected ? "Vista actual" : option.metric}
                variant={isSelected ? "filled" : "outlined"}
              />
            </Stack>

            <Box minWidth={0}>
              <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                {option.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {option.description}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ mt: "auto" }}>
              {option.metric}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function SellerActivityPage() {
  const [selectedSection, setSelectedSection] = useState<SellerActivitySection>("events");
  const {
    action,
    activeFilterLabels,
    activitySummary,
    autoRefreshIntervalSeconds,
    error,
    from,
    invalidFilters,
    isAutoRefreshPaused,
    isLoading,
    limit,
    loadActivity,
    relativeLastUpdated,
    resetFilters,
    rows,
    search,
    sellerBreakdown,
    sellerId,
    sellers,
    setAction,
    setFrom,
    setIsAutoRefreshPaused,
    setLimit,
    setSearch,
    setSellerId,
    setTo,
    summary,
    to,
    today,
    visibleRows,
  } = useSellerActivityData();

  const consultActivity = () => void loadActivity();
  const totalServerEvents = summary.reduce((sum, item) => sum + item.count, 0);

  const sectionOptions = useMemo<SectionOption[]>(
    () => [
      {
        value: "events",
        label: "Eventos recientes",
        description: "Una bandeja visual para entender qué pasó, quién lo hizo y si requiere revisión.",
        metric: `${visibleRows.length} visibles`,
        icon: <TimelineOutlinedIcon />,
        tone: "primary",
      },
      {
        value: "sellers",
        label: "Vendedores",
        description: "Compara actividad por persona: movimientos, ventas, bloqueos y última operación.",
        metric: `${sellerBreakdown.length} vendedores`,
        icon: <GroupsOutlinedIcon />,
        tone: "info",
      },
      {
        value: "signals",
        label: "Señales",
        description: "Resume patrones del periodo para detectar ventas, bloqueos y vendedores sin movimiento.",
        metric: `${totalServerEvents} eventos`,
        icon: <InsightsOutlinedIcon />,
        tone: "warning",
      },
    ],
    [sellerBreakdown.length, totalServerEvents, visibleRows.length],
  );

  return (
    <>
      <PageHeader
        title="Actividad de vendedores"
        subtitle="Panel visual para entender actividad del equipo, detectar bloqueos y revisar señales operativas sin leer una bitácora técnica."
      />

      <SellerActivityHero
        autoRefreshIntervalSeconds={autoRefreshIntervalSeconds}
        isAutoRefreshPaused={isAutoRefreshPaused}
        relativeLastUpdated={relativeLastUpdated}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SellerActivityMetrics rowsCount={rows.length} summary={activitySummary} />

      <SellerActivityFiltersPanel
        action={action}
        activeFilterLabels={activeFilterLabels}
        from={from}
        invalidFilters={invalidFilters}
        isAutoRefreshPaused={isAutoRefreshPaused}
        isLoading={isLoading}
        limit={limit}
        onConsult={consultActivity}
        onRefreshNow={consultActivity}
        onResetFilters={resetFilters}
        onToggleAutoRefresh={() => setIsAutoRefreshPaused((current) => !current)}
        search={search}
        sellerId={sellerId}
        sellers={sellers}
        setAction={setAction}
        setFrom={setFrom}
        setLimit={setLimit}
        setSearch={setSearch}
        setSellerId={setSellerId}
        setTo={setTo}
        to={to}
        today={today}
      />

      <Card
        variant="outlined"
        data-testid="seller-activity-section-tabs-card"
        sx={(theme) => ({
          my: 2,
          overflow: "hidden",
          borderColor: alpha(theme.palette.primary.main, 0.18),
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(
            theme.palette.background.paper,
            0.98,
          )} 44%, ${alpha(theme.palette.info.main, 0.08)})`,
        })}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={900}>
                  Modo de revisión
                </Typography>
                <Typography variant="h6" fontWeight={950}>
                  Elige cómo quieres leer la actividad
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
                  Eventos responde “qué pasó ahora”, Vendedores compara personas y Señales muestra patrones del periodo.
                </Typography>
              </Box>
              <Chip color="primary" variant="outlined" label="Lectura por propósito" sx={{ alignSelf: { xs: "flex-start", md: "center" } }} />
            </Stack>

            <Grid container spacing={1.5}>
              {sectionOptions.map((option) => (
                <Grid item xs={12} md={4} key={option.value}>
                  <ReviewModeCard
                    option={option}
                    isSelected={selectedSection === option.value}
                    onClick={() => setSelectedSection(option.value)}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {selectedSection === "events" && <SellerActivityTimeline rows={visibleRows} totalRows={rows.length} />}

      {selectedSection === "sellers" && <SellerActivitySellerFocus summaries={sellerBreakdown} />}

      {selectedSection === "signals" && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SellerActivityOperationalInsights sellers={sellers} summaries={sellerBreakdown} summary={summary} />
          </Grid>
          <Grid item xs={12}>
            <SellerActivitySummaryPanel summary={summary} />
          </Grid>
        </Grid>
      )}
    </>
  );
}
