import { Alert, Grid, Stack } from "@mui/material";

import { ResponsiveSideLayout } from "../../components/layout";

import { PageHeader } from "../../components/PageHeader";
import { SellerActivityFiltersPanel } from "./SellerActivityFiltersPanel";
import { SellerActivityHero } from "./SellerActivityHero";
import { SellerActivityMetrics } from "./SellerActivityMetrics";
import { SellerActivityOperationalInsights } from "./SellerActivityOperationalInsights";
import { SellerActivitySellerFocus } from "./SellerActivitySellerFocus";
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

  const activitySidebar = (
    <Stack spacing={2}>
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
  );

  return (
    <>
      <PageHeader
        title="Actividad de vendedores"
        subtitle="Pulso operativo del equipo: ventas, consultas, accesos y señales que conviene revisar sin entrar a datos técnicos."
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
      <SellerActivityOperationalInsights sellers={sellers} summaries={sellerBreakdown} summary={summary} />
      <SellerActivitySellerFocus summaries={sellerBreakdown} />

      <ResponsiveSideLayout
        desktopSidebarPosition="left"
        mobileSidebarPosition="before"
        sidebar={activitySidebar}
        sidebarWidth="minmax(300px, 380px)"
        stickyTop={96}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SellerActivityTimeline rows={visibleRows} totalRows={rows.length} />
          </Grid>
        </Grid>
      </ResponsiveSideLayout>
    </>
  );
}
