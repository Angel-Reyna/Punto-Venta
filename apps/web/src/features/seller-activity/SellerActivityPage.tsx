import { Alert, Grid, Stack } from "@mui/material";

import { PageHeader } from "../../components/PageHeader";
import { SellerActivityFiltersPanel } from "./SellerActivityFiltersPanel";
import { SellerActivityHero } from "./SellerActivityHero";
import { SellerActivityMetrics } from "./SellerActivityMetrics";
import { SellerActivitySummaryPanel } from "./SellerActivitySummaryPanel";
import { SellerActivityTimeline } from "./SellerActivityTimeline";
import { useSellerActivityData } from "./useSellerActivityData";

export function SellerActivityPage() {
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

  return (
    <>
      <PageHeader
        title="Actividad de vendedores"
        subtitle="Revisa ventas, consultas operativas e intentos de acceso por vendedor con una vista clara de filtros y eventos."
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

      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} lg={4}>
          <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
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

            <SellerActivitySummaryPanel summary={summary} />
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <SellerActivityTimeline rows={visibleRows} totalRows={rows.length} />
        </Grid>
      </Grid>
    </>
  );
}
