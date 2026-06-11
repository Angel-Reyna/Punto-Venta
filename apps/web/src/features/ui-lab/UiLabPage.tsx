import type { ElementType, ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type SxProps, type Theme, useTheme } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import EditIcon from "@mui/icons-material/Edit";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { pvVisualTokens } from "../../design-lab/pvVisualTokens";
import { CategoryPill } from "../products/categoryVisuals";

type Tone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type ProductStatus = "Activo" | "Inactivo";
type StockStatus = "Disponible" | "Bajo stock" | "Sin stock";

type ProductPrototypeRow = {
  barcode: string;
  category: string;
  costPrice: number;
  description: string;
  finalPrice: number;
  margin: number;
  minStock: number;
  name: string;
  promoPercent: number;
  salePrice: number;
  sku: string;
  status: ProductStatus;
  stock: number;
  stockStatus: StockStatus;
  tone: Extract<Tone, "success" | "warning" | "error" | "secondary">;
};

type Metric = {
  description: string;
  icon: ElementType;
  label: string;
  tone: Tone;
  value: string;
};

const productRows: ProductPrototypeRow[] = [
  {
    barcode: "7501055300075",
    category: "Bebidas frías",
    costPrice: 11.5,
    description: "Refresco individual de alta rotación. Visible para venta directa y reportes por vendedor.",
    finalPrice: 18,
    margin: 36.1,
    minStock: 24,
    name: "Coca-Cola 600 ml",
    promoPercent: 0,
    salePrice: 18,
    sku: "BEB-COCA-600",
    status: "Activo",
    stock: 72,
    stockStatus: "Disponible",
    tone: "success",
  },
  {
    barcode: "PV-MAR-250G",
    category: "Abarrotes",
    costPrice: 18,
    description: "Producto base para despensa. Debe conservar código interno claro para importación Excel.",
    finalPrice: 25.5,
    margin: 29.4,
    minStock: 20,
    name: "Harina de maíz 250 g",
    promoPercent: 15,
    salePrice: 30,
    sku: "ABA-HARINA-250",
    status: "Activo",
    stock: 14,
    stockStatus: "Bajo stock",
    tone: "warning",
  },
  {
    barcode: "PV-SAB-045",
    category: "Snacks",
    costPrice: 12,
    description: "Botana sin unidades disponibles. Se mantiene visible para auditoría y reposición.",
    finalPrice: 17,
    margin: 29.4,
    minStock: 12,
    name: "Sabritas Original 45 g",
    promoPercent: 0,
    salePrice: 17,
    sku: "BOT-SAB-045",
    status: "Activo",
    stock: 0,
    stockStatus: "Sin stock",
    tone: "error",
  },
  {
    barcode: "PV-LIM-CLORO-1L",
    category: "Limpieza",
    costPrice: 15,
    description: "Producto pausado temporalmente. No debe venderse, pero conserva historial e importaciones.",
    finalPrice: 24,
    margin: 37.5,
    minStock: 8,
    name: "Cloro multiusos 1 L",
    promoPercent: 0,
    salePrice: 24,
    sku: "LIM-CLORO-1L",
    status: "Inactivo",
    stock: 31,
    stockStatus: "Disponible",
    tone: "secondary",
  },
];

const productMetrics: Metric[] = [
  {
    description: "Productos disponibles para operación diaria.",
    icon: StorefrontIcon,
    label: "Activos",
    tone: "success",
    value: "34",
  },
  {
    description: "En o debajo del mínimo configurado.",
    icon: WarningAmberIcon,
    label: "Bajo stock",
    tone: "warning",
    value: "6",
  },
  {
    description: "Visibles para auditoría y reposición.",
    icon: ErrorOutlineIcon,
    label: "Sin stock",
    tone: "error",
    value: "3",
  },
  {
    description: "Con descuento aplicado al precio final.",
    icon: LocalOfferIcon,
    label: "Promoción",
    tone: "info",
    value: "5",
  },
];

const filterChips = ["Todos", "Activos", "Inactivos", "Bajo stock", "Sin stock", "Con promoción"];

const formFields = [
  ["Clave interna/SKU", "BEB-COCA-600", "Identificador único para inventario e importación."],
  ["Código del producto", "7501055300075", "Código físico, de proveedor o generado por el sistema."],
  ["Nombre", "Coca-Cola 600 ml", "Nombre visible para ventas y reportes."],
  ["Categoría", "Bebidas frías", "Usa categoría real; sin categorías demo."],
  ["Costo unitario", "$11.50", "Base para margen de utilidad."],
  ["Precio de venta", "$18.00", "Precio antes de promoción."],
  ["Promoción", "0%", "Descuento porcentual opcional."],
  ["Stock mínimo", "24", "Alerta cuando stock actual llega a este número o queda debajo."],
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function toneMain(theme: Theme, tone: Tone) {
  return theme.palette[tone].main;
}

function Surface({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
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

function IconTile({ icon: Icon, size = 42, tone }: { icon: ElementType; size?: number; tone: Tone }) {
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

function SectionHeader({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography color="primary.main" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
        {eyebrow}
      </Typography>
      <Typography component="h2" fontWeight={950} letterSpacing="-0.04em" variant="h4">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 960 }} variant="body1">
        {description}
      </Typography>
    </Stack>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const theme = useTheme();
  const color = toneMain(theme, metric.tone);

  return (
    <Box
      sx={{
        background: `linear-gradient(145deg, ${alpha(color, 0.13)}, ${alpha(theme.palette.background.paper, 0.82)})`,
        border: "1px solid",
        borderColor: alpha(color, 0.24),
        borderRadius: 3.25,
        display: "grid",
        gap: 1.2,
        gridTemplateColumns: "auto minmax(0, 1fr)",
        minHeight: 112,
        p: 1.35,
      }}
    >
      <IconTile icon={metric.icon} size={44} tone={metric.tone} />
      <Stack minWidth={0} spacing={0.3}>
        <Typography color="text.secondary" fontSize={11} fontWeight={900} letterSpacing="0.07em" textTransform="uppercase">
          {metric.label}
        </Typography>
        <Typography color={color} fontSize={30} fontWeight={950} lineHeight={1}>
          {metric.value}
        </Typography>
        <Typography color="text.secondary" fontSize={12.25} lineHeight={1.25}>
          {metric.description}
        </Typography>
      </Stack>
    </Box>
  );
}

function ProductsHero() {
  return (
    <Surface
      sx={(theme) => ({
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(15, 23, 42, 0.7))"
            : "linear-gradient(135deg, rgba(37, 99, 235, 0.11), rgba(255, 255, 255, 0.92) 48%, rgba(34, 197, 94, 0.08))",
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.18),
      })}
    >
      <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2.2}>
        <Stack direction="row" spacing={1.35}>
          <IconTile icon={StorefrontIcon} size={56} tone="primary" />
          <Box>
            <Typography color="text.secondary" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
              Desktop 1366 × 900 · Productos
            </Typography>
            <Typography component="h1" fontWeight={950} letterSpacing="-0.04em" variant="h4">
              Catálogo de productos
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 820 }} variant="body2">
              Prototipo visual para administrar productos, códigos, categorías, precios, promociones, estados y alertas de stock antes de migrar a la página real.
            </Typography>
          </Box>
        </Stack>

        <Stack alignItems={{ xs: "stretch", sm: "center", lg: "flex-end" }} direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1}>
          <Button startIcon={<AddCircleIcon />} variant="contained">
            Nuevo producto
          </Button>
          <Stack direction="row" flexWrap="wrap" gap={1} justifyContent={{ xs: "flex-start", lg: "flex-end" }}>
            <Button startIcon={<FileDownloadIcon />} variant="outlined">
              Formato Excel
            </Button>
            <Button startIcon={<UploadFileIcon />} variant="outlined">
              Importar
            </Button>
            <Button color="error" startIcon={<DeleteSweepIcon />} variant="outlined">
              Eliminar catálogo
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Surface>
  );
}

function ProductsMetrics() {
  return (
    <Box sx={{ display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, minmax(0, 1fr))" } }}>
      {productMetrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </Box>
  );
}

function ProductsToolbarPrototype() {
  return (
    <Surface>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.4}>
          <Box>
            <Typography fontWeight={950} letterSpacing="-0.025em" variant="h5">
              Gestión del catálogo
            </Typography>
            <Typography color="text.secondary" variant="body2">
              La búsqueda queda como acción principal; filtros y orden son secundarios para no saturar móvil.
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button startIcon={<SortIcon />} variant="outlined">
              Ordenar
            </Button>
            <Button startIcon={<FilterListIcon />} variant="outlined">
              Filtros
            </Button>
          </Stack>
        </Stack>

        <TextField
          fullWidth
          placeholder="Buscar por producto, SKU, código, categoría o descripción"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack direction="row" flexWrap="wrap" gap={0.8}>
          {filterChips.map((filter, index) => (
            <Chip
              color={index === 0 ? "primary" : "default"}
              key={filter}
              label={filter}
              size="small"
              variant={index === 0 ? "filled" : "outlined"}
              sx={{ fontWeight: 850 }}
            />
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function ProductIdentity({ product }: { product: ProductPrototypeRow }) {
  return (
    <Stack direction="row" minWidth={0} spacing={1.25}>
      <IconTile icon={Inventory2Icon} size={58} tone={product.tone} />
      <Stack minWidth={0} spacing={0.7}>
        <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}>
          <Typography fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
            {product.name}
          </Typography>
          <Chip color={product.status === "Activo" ? "success" : "default"} label={product.status} size="small" sx={{ fontWeight: 850 }} />
          <Chip color={product.tone} label={product.stockStatus} size="small" variant="outlined" sx={{ fontWeight: 850 }} />
        </Stack>
        <Typography color="text.secondary" fontSize={12.5} lineHeight={1.35}>
          {product.description}
        </Typography>
        <CategoryPill label={product.category} />
      </Stack>
    </Stack>
  );
}

function CodeBlock({ product }: { product: ProductPrototypeRow }) {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <QrCode2Icon color="primary" fontSize="small" />
        <Typography color="text.secondary" fontSize={10.5} fontWeight={900} letterSpacing="0.08em" textTransform="uppercase">
          Identificación
        </Typography>
      </Stack>
      <Box sx={{ display: "grid", gap: 0.7 }}>
        <Box>
          <Typography color="text.secondary" fontSize={11.5} fontWeight={850}>
            Clave interna/SKU
          </Typography>
          <Typography fontSize={13.5} fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
            {product.sku}
          </Typography>
        </Box>
        <Box>
          <Typography color="text.secondary" fontSize={11.5} fontWeight={850}>
            Código del producto
          </Typography>
          <Typography fontSize={13.5} fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
            {product.barcode}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

function PriceBlock({ product }: { product: ProductPrototypeRow }) {
  return (
    <Stack spacing={0.8}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <LocalOfferIcon color="primary" fontSize="small" />
        <Typography color="text.secondary" fontSize={10.5} fontWeight={900} letterSpacing="0.08em" textTransform="uppercase">
          Precio y margen
        </Typography>
      </Stack>
      <Box sx={{ display: "grid", gap: 0.7, gridTemplateColumns: "1fr 1fr" }}>
        <MiniField label="Costo" value={formatCurrency(product.costPrice)} />
        <MiniField label="Venta" value={formatCurrency(product.salePrice)} />
        <MiniField label="Final" value={formatCurrency(product.finalPrice)} emphasize />
        <MiniField label="Margen" value={`${product.margin.toFixed(1)}%`} />
      </Box>
      {product.promoPercent > 0 ? <Chip color="info" label={`${product.promoPercent}% de promoción`} size="small" sx={{ alignSelf: "flex-start", fontWeight: 850 }} /> : null}
    </Stack>
  );
}

function MiniField({ emphasize = false, label, value }: { emphasize?: boolean; label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" fontSize={11.5} fontWeight={850}>
        {label}
      </Typography>
      <Typography fontSize={13.5} fontWeight={emphasize ? 950 : 850}>
        {value}
      </Typography>
    </Box>
  );
}

function StockBlock({ product }: { product: ProductPrototypeRow }) {
  const theme = useTheme();
  const color = toneMain(theme, product.tone);
  const progressValue = product.stock <= 0 ? 0 : Math.min(100, Math.round((product.stock / Math.max(product.minStock * 2, 1)) * 100));
  const delta = product.stock - product.minStock;

  return (
    <Box
      sx={{
        backgroundColor: alpha(color, 0.08),
        border: "1px solid",
        borderColor: alpha(color, 0.22),
        borderRadius: 3,
        p: 1.15,
      }}
    >
      <Stack spacing={0.9} sx={{ pt: 0.35 }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
          <Typography color="text.secondary" fontSize={10.5} fontWeight={900} letterSpacing="0.08em" textTransform="uppercase">
            Stock actual/mínimo
          </Typography>
          <Typography color={color} fontSize={12.5} fontWeight={950}>
            {product.stockStatus}
          </Typography>
        </Stack>
        <Stack alignItems="baseline" direction="row" spacing={1}>
          <Typography color={color} fontSize={34} fontWeight={950} lineHeight={1}>
            {formatNumber(product.stock)}
          </Typography>
          <Typography color="text.secondary" fontSize={12.5} fontWeight={850}>
            mínimo {formatNumber(product.minStock)}
          </Typography>
        </Stack>
        <LinearProgress color={product.tone} value={progressValue} variant="determinate" sx={{ borderRadius: 999, height: 7 }} />
        <Typography color="text.secondary" fontSize={12.25}>
          {delta >= 0 ? `+${formatNumber(delta)} sobre el mínimo` : `Faltan ${formatNumber(Math.abs(delta))} unidades`}
        </Typography>
      </Stack>
    </Box>
  );
}

function ProductActions({ product }: { product: ProductPrototypeRow }) {
  const buttonSx = { borderRadius: 2.25, fontSize: 12.5, fontWeight: 900, justifyContent: "flex-start", minHeight: 34 } as const;

  return (
    <Stack spacing={0.7}>
      <Typography color="text.secondary" fontSize={10.5} fontWeight={900} letterSpacing="0.08em" textTransform="uppercase">
        Acciones admin
      </Typography>
      <Button size="small" startIcon={<EditIcon fontSize="small" />} sx={buttonSx} variant="contained">
        Editar
      </Button>
      <Button color={product.status === "Activo" ? "warning" : "success"} size="small" startIcon={<ToggleOffIcon fontSize="small" />} sx={buttonSx} variant="outlined">
        {product.status === "Activo" ? "Desactivar" : "Activar"}
      </Button>
      <Button color="error" size="small" startIcon={<DeleteIcon fontSize="small" />} sx={buttonSx} variant="outlined">
        Eliminar
      </Button>
    </Stack>
  );
}

function ProductRowCard({ product }: { product: ProductPrototypeRow }) {
  const theme = useTheme();
  const color = toneMain(theme, product.tone);

  return (
    <Box
      sx={{
        background:
          product.status === "Inactivo"
            ? alpha(theme.palette.action.disabledBackground, 0.62)
            : `linear-gradient(135deg, ${alpha(color, 0.08)}, ${alpha(theme.palette.background.paper, 0.84)} 44%)`,
        border: "1px solid",
        borderColor: alpha(color, product.status === "Inactivo" ? 0.14 : 0.26),
        borderLeft: "5px solid",
        borderLeftColor: color,
        borderRadius: 3.5,
        display: "grid",
        gap: 1.35,
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.25fr) minmax(170px, 0.7fr) minmax(190px, 0.75fr)",
          xl: "minmax(0, 1.3fr) minmax(180px, 0.64fr) minmax(220px, 0.74fr) minmax(220px, 0.76fr) 126px",
        },
        p: 1.35,
      }}
    >
      <ProductIdentity product={product} />
      <CodeBlock product={product} />
      <PriceBlock product={product} />
      <StockBlock product={product} />
      <ProductActions product={product} />
    </Box>
  );
}

function ProductCatalogPrototype() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Lista compacta para PC que baja a tarjetas en móvil. Mantiene todo lo administrativo, pero separa identidad, precio, stock y acciones para que no se mezclen."
          eyebrow="Catálogo"
          title="Productos actuales"
        />
        <Stack spacing={1.05}>
          {productRows.map((product) => (
            <ProductRowCard key={product.sku} product={product} />
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}

function ProductFormPrototype() {
  return (
    <Surface>
      <Stack spacing={1.7}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.4}>
          <SectionHeader
            description="La captura queda dividida por intención: identificación, categoría, precio e inventario. Los ceros no deben estorbar; cada campo muestra una ayuda breve."
            eyebrow="Crear / editar"
            title="Formulario de producto"
          />
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}>
            <Button startIcon={<QrCode2Icon />} variant="outlined">
              Generar código
            </Button>
            <Button variant="contained">Guardar</Button>
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" } }}>
          {formFields.map(([label, value, helper]) => (
            <Box
              key={label}
              sx={(theme) => ({
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.9),
                borderRadius: 3,
                minHeight: 104,
                p: 1.25,
              })}
            >
              <Typography color="text.secondary" fontSize={11} fontWeight={900} letterSpacing="0.07em" textTransform="uppercase">
                {label}
              </Typography>
              <Typography fontSize={16} fontWeight={950} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
                {value}
              </Typography>
              <Typography color="text.secondary" fontSize={12.25} lineHeight={1.3} sx={{ mt: 0.55 }}>
                {helper}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.info.main, 0.06),
            border: "1px solid",
            borderColor: alpha(theme.palette.info.main, 0.22),
            borderRadius: 3,
            p: 1.35,
          })}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <IconTile icon={CategoryIcon} size={40} tone="info" />
              <Box>
                <Typography fontWeight={950}>Importación Excel como herramienta secundaria</Typography>
                <Typography color="text.secondary" variant="body2">
                  El flujo manual debe seguir siendo claro. Excel queda para altas o actualizaciones masivas de administrador.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Button startIcon={<FileDownloadIcon />} variant="outlined">
                Descargar formato
              </Button>
              <Button startIcon={<UploadFileIcon />} variant="outlined">
                Subir .xlsx
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function MobileProductsPreview() {
  return (
    <Surface sx={{ display: { xs: "none", lg: "block" } }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography color="primary.main" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
            Vista móvil
          </Typography>
          <Typography fontWeight={950} variant="h6">
            390 × 844
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.background.default, 0.74),
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 5,
            maxWidth: 390,
            mx: "auto",
            overflow: "hidden",
            p: 1.25,
          })}
        >
          <Stack spacing={1.05}>
            <Typography fontWeight={950}>Productos</Typography>
            <TextField placeholder="Buscar producto" size="small" fullWidth />
            <Stack direction="row" flexWrap="wrap" gap={0.6}>
              {filterChips.slice(0, 4).map((chip, index) => (
                <Chip color={index === 0 ? "primary" : "default"} key={chip} label={chip} size="small" variant={index === 0 ? "filled" : "outlined"} />
              ))}
            </Stack>
            {productRows.slice(0, 2).map((product) => (
              <Box key={product.sku} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={900}>{product.name}</Typography>
                  <Chip color={product.tone} label={product.stockStatus} size="small" />
                </Stack>
                <Typography color="text.secondary" fontSize={12.5}>
                  {product.sku} · {formatCurrency(product.finalPrice)}
                </Typography>
                <Typography color="text.secondary" fontSize={12.5}>
                  Stock {product.stock} · mínimo {product.minStock}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function DesignTokenSummary() {
  const { density, layout } = pvVisualTokens;

  const tokens = [
    ["Padding móvil", `${layout.mobileContentPadding}px`],
    ["Padding desktop", `${layout.desktopContentPadding}px`],
    ["Radio tarjetas", `${layout.cardRadius}px`],
    ["Fila tabla", `${layout.tableRowHeight}px`],
    ["Gap sección", `${layout.sectionGap}px`],
    ["Gap denso", `${layout.denseSectionGap}px`],
    ["Control compacto", `${density.compactControlHeight}px`],
    ["Touch target", `${density.touchTarget}px`],
  ];

  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Estos tokens evitan migrar el diseño a ojo. La página real debe respetar radios, gaps, tamaños y breakpoints aprobados aquí."
          eyebrow="Tokens"
          title="Medidas para migración"
        />
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          {tokens.map(([label, value]) => (
            <Box key={label} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, px: 1.3, py: 1.05 }}>
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

function ProductsEditablePrototype() {
  return (
    <Stack spacing={2}>
      <ProductsHero />
      <ProductsMetrics />
      <ProductsToolbarPrototype />
      <ProductCatalogPrototype />
      <ProductFormPrototype />
      <MobileProductsPreview />
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
            ? "radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 34%), #070f1d"
            : "radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 34%), #f6f8fb",
        minHeight: "100vh",
        px: {
          xs: `${pvVisualTokens.layout.mobileContentPadding}px`,
          sm: `${pvVisualTokens.layout.tabletContentPadding}px`,
          lg: `${pvVisualTokens.layout.desktopContentPadding}px`,
        },
        py: { xs: 3, md: 4 },
      }}
    >
      <Stack spacing={2.4} sx={{ maxWidth: pvVisualTokens.layout.pageMaxWidth, mx: "auto" }}>
        <Surface>
          <Stack spacing={1.25}>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip color="primary" label="UI Lab" />
              <Chip label="Productos" variant="outlined" />
              <Chip label="No toca backend" variant="outlined" />
              <Chip label="Dev-only" variant="outlined" />
            </Stack>
            <SectionHeader
              description="Prototipo ejecutable para revisar Productos antes de tocar la página real. Usa datos mock, Material UI y tokens medibles."
              eyebrow="Punta Venta"
              title="Laboratorio visual de Productos"
            />
          </Stack>
        </Surface>

        <ProductsEditablePrototype />
      </Stack>
    </Box>
  );
}
