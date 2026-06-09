import { useMemo, type ReactNode } from "react";

import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { InventoryTransferRequest, StockItem, StockLocation } from "./inventoryShared";

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("es-MX");

type LocationStatus = "available" | "low" | "out";

type WarehouseInsight = {
  id: string;
  name: string;
  type: "STORAGE" | "SELLER" | "UNKNOWN";
  sellerId: string | null;
  totalUnits: number;
  productsWithStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

type RiskProduct = {
  id: string;
  sku: string;
  name: string;
  minStock: number;
  totalStock: number;
  storageStock: number;
  sellerStock: number;
  lowLocations: number;
  outLocations: number;
};

type InventoryInsights = {
  centralUnits: number;
  sellerUnits: number;
  totalUnits: number;
  lowLocations: number;
  outLocations: number;
  riskProducts: RiskProduct[];
  pendingTransferCount: number;
  pendingTransferUnits: number;
  warehouses: WarehouseInsight[];
  sellerWarehouses: WarehouseInsight[];
};

export function InventoryOperationalInsights({
  stockRows,
  transferRequests,
}: {
  stockRows: StockItem[];
  transferRequests: InventoryTransferRequest[];
}) {
  const insights = useMemo(
    () => buildInventoryInsights(stockRows, transferRequests),
    [stockRows, transferRequests],
  );
  const topWarehouses = insights.warehouses.slice(0, 4);
  const topSellerWarehouse = insights.sellerWarehouses[0];
  const topRiskProducts = insights.riskProducts.slice(0, 4);

  return (
    <Card data-testid="inventory-operational-insights" sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1.6}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "flex-start" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.35 }}>
                Señales operativas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lectura rápida del stock central, stock asignado a vendedores y productos que requieren atención.
              </Typography>
            </Box>
            <Chip
              color={insights.riskProducts.length > 0 ? "warning" : "success"}
              variant="outlined"
              label={
                insights.riskProducts.length > 0
                  ? `${insights.riskProducts.length} producto${insights.riskProducts.length === 1 ? "" : "s"} en riesgo`
                  : "Sin riesgo visible"
              }
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, fontWeight: 900 }}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <InsightMetricCard
              testId="inventory-operational-central-units"
              label="Stock central"
              value={formatCount(insights.centralUnits)}
              helper="Unidades en almacenes operativos."
              tone="primary"
            />
            <InsightMetricCard
              testId="inventory-operational-seller-units"
              label="Stock con vendedores"
              value={formatCount(insights.sellerUnits)}
              helper="Unidades físicamente asignadas."
              tone="info"
            />
            <InsightMetricCard
              testId="inventory-operational-risk-products"
              label="Productos en riesgo"
              value={formatCount(insights.riskProducts.length)}
              helper={`${formatCount(insights.outLocations)} ubicaciones sin stock · ${formatCount(insights.lowLocations)} bajo mínimo.`}
              tone={insights.riskProducts.length > 0 ? "warning" : "success"}
            />
            <InsightMetricCard
              testId="inventory-operational-pending-transfers"
              label="Retiros pendientes"
              value={formatCount(insights.pendingTransferCount)}
              helper={`${formatCount(insights.pendingTransferUnits)} unidad${insights.pendingTransferUnits === 1 ? "" : "es"} solicitada${insights.pendingTransferUnits === 1 ? "" : "s"}.`}
              tone={insights.pendingTransferCount > 0 ? "warning" : "success"}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.2,
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              alignItems: "stretch",
            }}
          >
            <OperationalPanel title="Distribución por almacén" description="Dónde está concentrado el stock visible.">
              {topWarehouses.length === 0 ? (
                <EmptyInsightText text="Sin stock distribuido todavía." />
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {topWarehouses.map((warehouse) => (
                    <WarehouseInsightRow key={warehouse.id} warehouse={warehouse} />
                  ))}
                </Stack>
              )}
            </OperationalPanel>

            <OperationalPanel title="Stock asignado y riesgo" description="Foco en vendedores y productos que pueden bloquear ventas.">
              <Stack spacing={1}>
                <Box data-testid="inventory-operational-seller-stock">
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    Vendedor con más stock físico
                  </Typography>
                  {topSellerWarehouse ? (
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 0.25 }}>
                      <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                        {topSellerWarehouse.name}
                      </Typography>
                      <Chip size="small" variant="outlined" label={`${formatCount(topSellerWarehouse.totalUnits)} unidades`} />
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay stock asignado a vendedores.
                    </Typography>
                  )}
                </Box>

                <Divider />

                {topRiskProducts.length === 0 ? (
                  <EmptyInsightText text="No hay productos con señales críticas en las existencias visibles." />
                ) : (
                  <Stack spacing={0.8}>
                    {topRiskProducts.map((product) => (
                      <RiskProductRow key={product.id} product={product} />
                    ))}
                  </Stack>
                )}
              </Stack>
            </OperationalPanel>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function InsightMetricCard({
  helper,
  label,
  testId,
  tone,
  value,
}: {
  helper: string;
  label: string;
  testId: string;
  tone: "primary" | "info" | "success" | "warning";
  value: string;
}) {
  return (
    <Box
      data-testid={testId}
      sx={(theme) => ({
        border: 1,
        borderColor: alpha(theme.palette[tone].main, 0.22),
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.08 : 0.045),
        minWidth: 0,
        p: 1.25,
      })}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={900}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.05, mt: 0.25 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
        {helper}
      </Typography>
    </Box>
  );
}

function OperationalPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: alpha(theme.palette.divider, 0.9),
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.2 : 0.5),
        minWidth: 0,
        p: 1.35,
      })}
    >
      <Typography variant="subtitle1" fontWeight={950}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {description}
      </Typography>
      {children}
    </Box>
  );
}

function WarehouseInsightRow({ warehouse }: { warehouse: WarehouseInsight }) {
  const hasAttention = warehouse.lowStockProducts > 0 || warehouse.outOfStockProducts > 0;
  const tone = warehouse.outOfStockProducts > 0 ? "error" : warehouse.lowStockProducts > 0 ? "warning" : "success";

  return (
    <Box
      data-testid={`inventory-operational-warehouse-${sanitizeTestId(warehouse.name)}`}
      sx={{ py: 0.85 }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
            {warehouse.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {warehouse.type === "SELLER" ? "Stock de vendedor" : "Almacén central"} · {formatCount(warehouse.productsWithStock)} producto{warehouse.productsWithStock === 1 ? "" : "s"} con unidades
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
          <Chip size="small" variant="outlined" label={`${formatCount(warehouse.totalUnits)} unidades`} />
          <Chip
            size="small"
            color={tone}
            variant={hasAttention ? "filled" : "outlined"}
            label={hasAttention ? `${warehouse.outOfStockProducts + warehouse.lowStockProducts} alertas` : "Estable"}
          />
        </Stack>
      </Stack>
    </Box>
  );
}

function RiskProductRow({ product }: { product: RiskProduct }) {
  const isCritical = product.outLocations > 0 || product.totalStock <= 0;

  return (
    <Box
      data-testid={`inventory-operational-risk-product-${product.sku}`}
      sx={(theme) => ({
        borderLeft: 4,
        borderLeftColor: theme.palette[isCritical ? "error" : "warning"].main,
        borderRadius: 2,
        bgcolor: alpha(theme.palette[isCritical ? "error" : "warning"].main, theme.palette.mode === "dark" ? 0.08 : 0.045),
        px: 1,
        py: 0.85,
      })}
    >
      <Stack spacing={0.45}>
        <Stack direction="row" spacing={0.75} justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SKU: {product.sku} · mínimo {formatCount(product.minStock)}
            </Typography>
          </Box>
          <Chip
            size="small"
            color={isCritical ? "error" : "warning"}
            variant="outlined"
            label={isCritical ? "Crítico" : "Atención"}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Central: {formatCount(product.storageStock)} · Vendedores: {formatCount(product.sellerStock)} · Total: {formatCount(product.totalStock)}
        </Typography>
      </Stack>
    </Box>
  );
}

function EmptyInsightText({ text }: { text: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
      {text}
    </Typography>
  );
}

function buildInventoryInsights(
  stockRows: StockItem[],
  transferRequests: InventoryTransferRequest[],
): InventoryInsights {
  const warehouseMap = new Map<string, WarehouseInsight>();
  const riskProducts: RiskProduct[] = [];
  let centralUnits = 0;
  let sellerUnits = 0;
  let lowLocations = 0;
  let outLocations = 0;

  for (const item of stockRows) {
    const minStock = Math.max(Number(item.minStock ?? 0), 0);
    const locations = normalizeLocations(item);
    let productStorageStock = 0;
    let productSellerStock = 0;
    let productLowLocations = 0;
    let productOutLocations = 0;

    for (const location of locations) {
      const quantity = Math.max(Number(location.quantity ?? 0), 0);
      const isSellerStock = location.warehouseType === "SELLER";
      const status = getLocationStatus(location, minStock);

      if (isSellerStock) {
        sellerUnits += quantity;
        productSellerStock += quantity;
      } else {
        centralUnits += quantity;
        productStorageStock += quantity;
      }

      if (status === "out") {
        outLocations += 1;
        productOutLocations += 1;
      }

      if (status === "low") {
        lowLocations += 1;
        productLowLocations += 1;
      }

      const warehouse = getOrCreateWarehouseInsight(warehouseMap, location);
      warehouse.totalUnits += quantity;
      if (quantity > 0) warehouse.productsWithStock += 1;
      if (status === "out") warehouse.outOfStockProducts += 1;
      if (status === "low") warehouse.lowStockProducts += 1;
    }

    const totalStock = locations.reduce((sum, location) => sum + Math.max(Number(location.quantity ?? 0), 0), 0);
    const productIsLow = item.lowStock || (totalStock > 0 && minStock > 0 && totalStock <= minStock);

    if (productOutLocations > 0 || productLowLocations > 0 || productIsLow) {
      riskProducts.push({
        id: item.id,
        sku: item.sku,
        name: item.name,
        minStock,
        totalStock,
        storageStock: productStorageStock,
        sellerStock: productSellerStock,
        lowLocations: productLowLocations,
        outLocations: productOutLocations,
      });
    }
  }

  const pendingTransfers = transferRequests.filter((request) => request.status === "PENDING");
  const warehouses = Array.from(warehouseMap.values()).sort((left, right) => {
    const typePriority = Number(left.type === "SELLER") - Number(right.type === "SELLER");
    return typePriority || right.totalUnits - left.totalUnits || left.name.localeCompare(right.name, "es");
  });
  const sellerWarehouses = warehouses
    .filter((warehouse) => warehouse.type === "SELLER")
    .sort((left, right) => right.totalUnits - left.totalUnits || left.name.localeCompare(right.name, "es"));

  return {
    centralUnits,
    sellerUnits,
    totalUnits: centralUnits + sellerUnits,
    lowLocations,
    outLocations,
    riskProducts: riskProducts.sort(sortRiskProducts),
    pendingTransferCount: pendingTransfers.length,
    pendingTransferUnits: pendingTransfers.reduce((sum, request) => sum + Number(request.totalUnits ?? 0), 0),
    warehouses,
    sellerWarehouses,
  };
}

function normalizeLocations(item: StockItem): StockLocation[] {
  if (item.locations && item.locations.length > 0) {
    return item.locations.map((location) => ({
      ...location,
      warehouseName: location.warehouseName?.trim() || "Principal",
      warehouseType: location.warehouseType ?? "STORAGE",
      quantity: Math.max(Number(location.quantity ?? 0), 0),
    }));
  }

  return [
    {
      warehouseId: "default",
      warehouseName: "Principal",
      warehouseType: "STORAGE",
      sellerId: null,
      quantity: Math.max(Number(item.stock ?? 0), 0),
    },
  ];
}

function getLocationStatus(location: StockLocation, minStock: number): LocationStatus {
  const quantity = Math.max(Number(location.quantity ?? 0), 0);

  if (quantity <= 0) return "out";
  if (minStock > 0 && quantity <= minStock) return "low";

  return "available";
}

function getOrCreateWarehouseInsight(
  warehouseMap: Map<string, WarehouseInsight>,
  location: StockLocation,
) {
  const warehouseId = location.warehouseId || "default";
  const existing = warehouseMap.get(warehouseId);

  if (existing) return existing;

  const warehouse: WarehouseInsight = {
    id: warehouseId,
    name: location.warehouseName?.trim() || "Principal",
    type: location.warehouseType ?? "UNKNOWN",
    sellerId: location.sellerId ?? null,
    totalUnits: 0,
    productsWithStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  };

  warehouseMap.set(warehouseId, warehouse);

  return warehouse;
}

function sortRiskProducts(left: RiskProduct, right: RiskProduct) {
  return (
    right.outLocations - left.outLocations ||
    right.lowLocations - left.lowLocations ||
    left.totalStock - right.totalStock ||
    left.name.localeCompare(right.name, "es")
  );
}

function formatCount(value: number) {
  return COMPACT_NUMBER_FORMATTER.format(Math.max(Number(value) || 0, 0));
}

function sanitizeTestId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "") || "almacen";
}
