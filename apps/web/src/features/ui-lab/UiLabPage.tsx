import type { ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import { pvVisualTokens } from "../../design-lab/pvVisualTokens";
import {
  inventoryMockItems,
  salesMockProducts,
  salesTicketMock,
  type MockInventoryItem,
  type MockSaleProduct,
} from "./uiLabMockData";

type Tone = "success" | "warning" | "error" | "info";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(value);
}

function getInventoryTone(item: MockInventoryItem): Tone {
  if (item.totalStock === 0) {
    return "error";
  }

  if (item.totalStock <= item.minimumStock) {
    return "warning";
  }

  return "success";
}

function getToneLabel(tone: Tone) {
  if (tone === "error") {
    return "Sin stock";
  }

  if (tone === "warning") {
    return "Stock bajo";
  }

  if (tone === "success") {
    return "Sano";
  }

  return "Referencia";
}

function Surface({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Card
      sx={{
        borderRadius: `${pvVisualTokens.layout.cardRadius}px`,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: compact ? 2 : { xs: 2, md: 2.5 } }}>{children}</CardContent>
    </Card>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Stack spacing={0.75}>
      <Typography color="primary.main" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
        {eyebrow}
      </Typography>
      <Typography component="h2" fontWeight={900} letterSpacing="-0.035em" variant="h4">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 880 }} variant="body1">
        {description}
      </Typography>
    </Stack>
  );
}

function TokenBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        px: 1.5,
        py: 1.25,
      }}
    >
      <Typography color="text.secondary" fontSize={12} fontWeight={700}>
        {label}
      </Typography>
      <Typography fontSize={15} fontWeight={850}>
        {value}
      </Typography>
    </Box>
  );
}

function ViewportSpecGrid() {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {pvVisualTokens.viewportPresets.map((preset) => (
        <Surface compact key={preset.key}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography fontWeight={900}>{preset.label}</Typography>
              <Chip label={preset.size} size="small" variant="outlined" />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              {preset.description}
            </Typography>
          </Stack>
        </Surface>
      ))}
    </Box>
  );
}

function InventoryStockBar({ item }: { item: MockInventoryItem }) {
  const theme = useTheme();
  const tone = getInventoryTone(item);
  const totalCapacity = Math.max(item.minimumStock * 2, item.totalStock, 1);
  const value = Math.min(100, Math.round((item.totalStock / totalCapacity) * 100));
  const color = theme.palette[tone].main;

  return (
    <Stack spacing={1}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography color="text.secondary" variant="caption">
          Existencia total
        </Typography>
        <Typography fontWeight={850} variant="body2">
          {item.totalStock} unidades
        </Typography>
      </Stack>
      <LinearProgress
        value={value}
        variant="determinate"
        sx={{
          height: 9,
          borderRadius: 999,
          backgroundColor: alpha(color, 0.14),
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
            borderRadius: 999,
          },
        }}
      />
    </Stack>
  );
}

function InventoryPrototype() {
  return (
    <Surface>
      <Stack spacing={2.25}>
        <Stack
          alignItems={{ xs: "flex-start", md: "center" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography color="text.secondary" fontWeight={800} variant="caption">
              Prototipo · Inventario
            </Typography>
            <Typography component="h3" fontWeight={900} letterSpacing="-0.03em" variant="h5">
              Tabla responsive compacta
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip color="warning" label="Amarillo: stock mínimo" size="small" variant="outlined" />
            <Chip color="error" label="Rojo: cero unidades" size="small" variant="outlined" />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "1.15fr 0.85fr",
            },
          }}
        >
          <Stack spacing={1.25}>
            {inventoryMockItems.map((item) => {
              const tone = getInventoryTone(item);

              return (
                <Box
                  key={item.sku}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderLeft: "6px solid",
                    borderLeftColor: `${tone}.main`,
                    borderRadius: 3,
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "minmax(0, 1.2fr) 170px",
                    },
                    minHeight: pvVisualTokens.layout.mobileCardMinHeight,
                    p: 1.5,
                  }}
                >
                  <Stack minWidth={0} spacing={0.75}>
                    <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
                      <Typography fontWeight={900}>{item.name}</Typography>
                      <Chip color={tone} label={getToneLabel(tone)} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      SKU {item.sku} · {item.category} · mínimo {item.minimumStock}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {item.warehouses.map((warehouse) => (
                        <Chip
                          key={`${item.sku}-${warehouse.name}`}
                          label={`${warehouse.name}: ${warehouse.stock}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Stack>
                  <InventoryStockBar item={item} />
                </Box>
              );
            })}
          </Stack>

          <Box
            sx={{
              alignSelf: "start",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              p: 2,
            }}
          >
            <Typography fontWeight={900} gutterBottom>
              Reglas visuales aprobables
            </Typography>
            <Stack spacing={1.25}>
              <Typography color="text.secondary" variant="body2">
                En móvil cada producto se vuelve tarjeta compacta, sin iconos, con color lateral y stock por almacén visible.
              </Typography>
              <Typography color="text.secondary" variant="body2">
                En tablet y desktop conserva densidad de tabla, pero no depende de scroll horizontal obligatorio.
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Los productos en cero siguen visibles para auditoría operativa.
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Surface>
  );
}

function ProductSearchCard({ product }: { product: MockSaleProduct }) {
  const disabled = product.stock <= 0;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: disabled ? "error.main" : "divider",
        borderRadius: 3,
        opacity: disabled ? 0.76 : 1,
        p: 1.5,
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.25}>
        <Stack minWidth={0} spacing={0.5}>
          <Typography fontWeight={900}>{product.name}</Typography>
          <Typography color="text.secondary" variant="body2">
            {product.sku} · {product.warehouse}
          </Typography>
          <Chip
            color={disabled ? "error" : "success"}
            label={disabled ? "Sin stock asignado" : `${product.stock} disponibles`}
            size="small"
            sx={{ alignSelf: "flex-start" }}
            variant="outlined"
          />
        </Stack>
        <Stack alignItems={{ xs: "stretch", sm: "flex-end" }} spacing={1}>
          <Typography fontWeight={900}>{formatCurrency(product.price)}</Typography>
          <Button disabled={disabled} size="small" sx={{ minHeight: 38 }}>
            Agregar
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function SalesPrototype() {
  const total = salesTicketMock.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <Surface>
      <Stack spacing={2.25}>
        <Stack
          alignItems={{ xs: "flex-start", md: "center" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography color="text.secondary" fontWeight={800} variant="caption">
              Prototipo · Ventas
            </Typography>
            <Typography component="h3" fontWeight={900} letterSpacing="-0.03em" variant="h5">
              Flujo vendedor con stock asignado
            </Typography>
          </Box>
          <Chip color="info" label="No depende de caja abierta" variant="outlined" />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) 360px",
            },
          }}
        >
          <Stack spacing={1.25}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 1.5,
              }}
            >
              <Typography color="text.secondary" fontWeight={800} variant="caption">
                Buscar producto
              </Typography>
              <Typography fontWeight={900}>F3 · Buscar por SKU o nombre</Typography>
              <Typography color="text.secondary" variant="body2">
                Resultado filtrado por stock físico del vendedor.
              </Typography>
            </Box>
            {salesMockProducts.map((product) => (
              <ProductSearchCard key={product.sku} product={product} />
            ))}
          </Stack>

          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              p: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Box>
                <Typography color="text.secondary" fontWeight={800} variant="caption">
                  Ticket activo
                </Typography>
                <Typography fontWeight={900}>Venta en efectivo</Typography>
              </Box>
              <Divider />
              {salesTicketMock.map((item) => (
                <Stack direction="row" justifyContent="space-between" key={item.name} spacing={1}>
                  <Box>
                    <Typography fontWeight={800}>{item.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.quantity} unidad(es)
                    </Typography>
                  </Box>
                  <Typography fontWeight={900}>{formatCurrency(item.subtotal)}</Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary" fontWeight={800}>
                  Total
                </Typography>
                <Typography fontWeight={950} variant="h5">
                  {formatCurrency(total)}
                </Typography>
              </Stack>
              <Button fullWidth>Registrar venta</Button>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Surface>
  );
}

function DesignTokenSummary() {
  const { layout, density } = pvVisualTokens;

  return (
    <Surface>
      <Stack spacing={2}>
        <SectionHeader
          description="Estos números son la fuente de verdad del prototipo. Si una variante se aprueba, se migra con estos mismos valores para evitar diseños interpretados a ojo."
          eyebrow="Tokens"
          title="Medidas que sí se pueden implementar"
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          <TokenBadge label="Padding móvil" value={`${layout.mobileContentPadding}px`} />
          <TokenBadge label="Padding desktop" value={`${layout.desktopContentPadding}px`} />
          <TokenBadge label="Radio tarjetas" value={`${layout.cardRadius}px`} />
          <TokenBadge label="Fila tabla" value={`${layout.tableRowHeight}px`} />
          <TokenBadge label="Gap sección" value={`${layout.sectionGap}px`} />
          <TokenBadge label="Gap denso" value={`${layout.denseSectionGap}px`} />
          <TokenBadge label="Control compacto" value={`${density.compactControlHeight}px`} />
          <TokenBadge label="Touch target" value={`${density.touchTarget}px`} />
        </Box>
      </Stack>
    </Surface>
  );
}

export function UiLabPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 34%), #070f1d"
            : "radial-gradient(circle at top left, rgba(37, 99, 235, 0.10), transparent 34%), #f6f8fb",
        px: {
          xs: `${pvVisualTokens.layout.mobileContentPadding}px`,
          sm: `${pvVisualTokens.layout.tabletContentPadding}px`,
          lg: `${pvVisualTokens.layout.desktopContentPadding}px`,
        },
        py: { xs: 3, md: 4 },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          maxWidth: pvVisualTokens.layout.pageMaxWidth,
          mx: "auto",
        }}
      >
        <Surface>
          <Stack spacing={2}>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip color="primary" label="UI Lab" />
              <Chip label="Prototipo visual" variant="outlined" />
              <Chip label="No toca backend" variant="outlined" />
            </Stack>
            <SectionHeader
              description="Laboratorio visual para aprobar layouts de Punta Venta antes de mover pantallas reales. Usa el theme de MUI, tokens explícitos, datos mock y variantes por dispositivo."
              eyebrow="Punta Venta"
              title="Referencia visual ejecutable"
            />
          </Stack>
        </Surface>

        <ViewportSpecGrid />
        <DesignTokenSummary />
        <InventoryPrototype />
        <SalesPrototype />
      </Stack>
    </Box>
  );
}
