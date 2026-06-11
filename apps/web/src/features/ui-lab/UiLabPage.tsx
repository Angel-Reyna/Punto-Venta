import type { ElementType, ReactNode } from "react";

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

import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SortIcon from "@mui/icons-material/Sort";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { pvVisualTokens } from "../../design-lab/pvVisualTokens";

type Tone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type SaleProductRow = {
  category: string;
  code: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  tone: Extract<Tone, "success" | "warning" | "error">;
};

type TicketRow = {
  name: string;
  price: number;
  quantity: number;
  sku: string;
  stock: number;
};

const saleProducts: SaleProductRow[] = [
  {
    category: "Bebidas frías",
    code: "7501055300075",
    name: "Coca-Cola 600 ml",
    price: 18,
    sku: "BEB-COCA-600",
    stock: 18,
    tone: "success",
  },
  {
    category: "Abarrotes",
    code: "PV-MAR-250G",
    name: "Harina de maíz 250 g",
    price: 25.5,
    sku: "ABA-HARINA-250",
    stock: 6,
    tone: "warning",
  },
  {
    category: "Snacks",
    code: "PV-SAB-045",
    name: "Sabritas Original 45 g",
    price: 17,
    sku: "BOT-SAB-045",
    stock: 2,
    tone: "warning",
  },
  {
    category: "Bebidas",
    code: "7500000000011",
    name: "Agua Mineral 1 L",
    price: 16,
    sku: "AGUA-1L",
    stock: 12,
    tone: "success",
  },
  {
    category: "Lácteos",
    code: "PV-LECHE-1L",
    name: "Leche entera 1 L",
    price: 28,
    sku: "LAC-LECHE-1L",
    stock: 4,
    tone: "warning",
  },
];

const ticketRows: TicketRow[] = [
  {
    name: "Coca-Cola 600 ml",
    price: 18,
    quantity: 2,
    sku: "BEB-COCA-600",
    stock: 18,
  },
  {
    name: "Harina de maíz 250 g",
    price: 25.5,
    quantity: 1,
    sku: "ABA-HARINA-250",
    stock: 6,
  },
];

const saleTotal = ticketRows.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0,
);
const paidAmount = 100;
const saleChange = Math.max(paidAmount - saleTotal, 0);

const quickFilters = ["Todos", "Disponibles", "Bajo stock"];

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
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <Stack spacing={0.75}>
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
      <Typography color="text.secondary" sx={{ maxWidth: 960 }} variant="body1">
        {description}
      </Typography>
    </Stack>
  );
}


function SalesSourcePanel() {
  const theme = useTheme();
  const warehouses = [
    [
      "Almacén principal",
      "Seleccionado",
      "5 productos visibles",
      "42 unidades vendibles",
      "success",
    ],
    [
      "Ruta Centro",
      "Alternativo",
      "3 productos visibles",
      "18 unidades vendibles",
      "info",
    ],
    [
      "Bodega secundaria",
      "Alternativo",
      "1 producto visible",
      "6 unidades vendibles",
      "secondary",
    ],
  ] as const;

  return (
    <Surface
      sx={(sourceTheme) => ({
        background:
          sourceTheme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(sourceTheme.palette.info.main, 0.14)}, ${alpha(sourceTheme.palette.background.paper, 0.92)})`
            : `linear-gradient(135deg, ${alpha(sourceTheme.palette.info.main, 0.08)}, ${alpha(sourceTheme.palette.background.paper, 0.96)})`,
        border: "1px solid",
        borderColor: alpha(sourceTheme.palette.info.main, 0.2),
      })}
    >
      <Stack spacing={1.55}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack direction="row" spacing={1.25}>
            <IconTile icon={WarehouseIcon} size={52} tone="info" />
            <Stack spacing={0.35}>
              <Typography
                color="text.secondary"
                fontWeight={850}
                letterSpacing="0.08em"
                textTransform="uppercase"
                variant="caption"
              >
                Antes de elegir productos
              </Typography>
              <Typography
                fontWeight={950}
                letterSpacing="-0.025em"
                variant="h5"
              >
                Almacén de salida
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ maxWidth: 780 }}
                variant="body2"
              >
                Esta sección controla qué productos aparecen en “Elegir
                productos”. Si no ves un producto, primero revisa que el almacén
                seleccionado tenga stock disponible.
              </Typography>
            </Stack>
          </Stack>
          <Chip
            color="info"
            label="Controla productos visibles"
            sx={{
              alignSelf: { xs: "flex-start", lg: "center" },
              fontWeight: 900,
            }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {warehouses.map(([name, status, products, units, tone], index) => {
            const selected = index === 0;
            const color = toneMain(theme, tone);

            return (
              <Box
                key={name}
                sx={{
                  background: selected
                    ? `linear-gradient(145deg, ${alpha(color, 0.15)}, ${alpha(theme.palette.background.paper, 0.88)})`
                    : alpha(theme.palette.background.paper, 0.72),
                  border: "1px solid",
                  borderColor: selected ? alpha(color, 0.42) : "divider",
                  borderLeft: "5px solid",
                  borderLeftColor: selected
                    ? color
                    : alpha(theme.palette.text.secondary, 0.24),
                  borderRadius: 3.25,
                  p: 1.25,
                }}
              >
                <Stack spacing={0.8}>
                  <Stack
                    alignItems="flex-start"
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography fontWeight={950}>{name}</Typography>
                    <Chip
                      color={selected ? "success" : "default"}
                      label={status}
                      size="small"
                      sx={{ fontWeight: 850 }}
                    />
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 0.8,
                      gridTemplateColumns: "1fr 1fr",
                    }}
                  >
                    <MiniField label="Productos" value={products} />
                    <MiniField label="Stock" value={units} />
                  </Box>
                  <Button
                    size="small"
                    startIcon={<WarehouseIcon fontSize="small" />}
                    variant={selected ? "contained" : "outlined"}
                  >
                    {selected ? "Usando este almacén" : "Cambiar aquí"}
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            backgroundColor: alpha(theme.palette.warning.main, 0.08),
            border: "1px solid",
            borderColor: alpha(theme.palette.warning.main, 0.22),
            borderRadius: 3,
            p: 1.2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" spacing={1}>
              <IconTile icon={WarningAmberIcon} size={38} tone="warning" />
              <Box>
                <Typography fontWeight={950}>
                  Productos visibles: Almacén principal
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  “Elegir productos” solo mostrará productos con stock en este
                  almacén. Los productos sin stock se ocultan para evitar ventas
                  inválidas.
                </Typography>
              </Box>
            </Stack>
            <Chip
              color="success"
              label="5 disponibles"
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                fontWeight: 900,
              }}
            />
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}
function SalesToolbarPrototype() {
  return (
    <Stack spacing={1.1}>
      <Stack
        alignItems={{ xs: "stretch", lg: "center" }}
        direction={{ xs: "column", lg: "row" }}
        spacing={1}
        sx={{ minWidth: 0 }}
      >
        <TextField
          placeholder="Buscar producto, SKU o código"
          size="small"
          sx={{ flex: "1 1 320px", maxWidth: { lg: 420 } }}
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

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{ flex: "0 0 auto" }}
        >
          <Button startIcon={<SortIcon />} variant="outlined">
            Ordenar
          </Button>
          <Button startIcon={<FilterListIcon />} variant="outlined">
            Filtros
          </Button>
          <Button startIcon={<AddCircleIcon />} variant="contained">
            Agregar exacto
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.8}>
        {quickFilters.map((filter, index) => (
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
  );
}

function ProductCard({ product }: { product: SaleProductRow }) {
  const theme = useTheme();
  const color = toneMain(theme, product.tone);
  const statusLabel =
    product.stock <= 0
      ? "Sin stock"
      : product.stock <= 6
        ? "Bajo stock"
        : "Disponible";

  return (
    <Box
      component="button"
      type="button"
      sx={{
        appearance: "none",
        backgroundColor: alpha(color, 0.06),
        border: "1px solid",
        borderColor: alpha(color, 0.26),
        borderRadius: 3,
        color: "inherit",
        cursor: "pointer",
        display: "grid",
        font: "inherit",
        minHeight: 66,
        p: 0.45,
        placeItems: "center",
        textAlign: "center",
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        width: "100%",
        "&:hover": {
          borderColor: alpha(color, 0.5),
          boxShadow: `0 14px 32px ${alpha(color, 0.14)}`,
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          borderColor: color,
          boxShadow: `0 0 0 3px ${alpha(color, 0.18)}`,
          outline: "none",
        },
      }}
    >
      <Stack alignItems="center" spacing={0.35} sx={{ minWidth: 0, width: "100%" }}>
        <IconTile icon={Inventory2Icon} size={24} tone={product.tone} />
        <Typography
          fontSize={11.5}
          fontWeight={950}
          lineHeight={1.08}
          sx={{ overflowWrap: "anywhere" }}
        >
          {product.name}
        </Typography>
        <Typography color="text.secondary" fontSize={9.8} lineHeight={1.1}>
          {product.category}
        </Typography>
        <Stack
          alignItems="center"
          direction="row"
          divider={<Divider flexItem orientation="vertical" />}
          justifyContent="center"
          spacing={0.55}
          sx={{ width: "100%" }}
        >
          <Typography fontSize={11.5} fontWeight={950}>
            {formatCurrency(product.price)}
          </Typography>
          <Typography color={color} fontSize={11.5} fontWeight={950}>
            {product.stock} disp.
          </Typography>
        </Stack>
        <Chip
          color={product.tone}
          label={statusLabel}
          size="small"
          variant="outlined"
          sx={{ fontSize: 9.5, fontWeight: 850, height: 18 }}
        />
      </Stack>
    </Box>
  );
}

function OperationPanel({
  action,
  children,
  description,
  eyebrow,
  sx,
  title,
  tone = "primary",
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  sx?: SxProps<Theme>;
  title: string;
  tone?: Tone;
}) {
  const theme = useTheme();
  const color = toneMain(theme, tone);

  return (
    <Box
      sx={[
        {
          backgroundColor: alpha(theme.palette.background.paper, 0.72),
          border: "1px solid",
          borderColor: alpha(color, 0.22),
          borderRadius: 3.5,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          p: { xs: 1.15, md: 1.35 },
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <Stack spacing={1.25} sx={{ minHeight: 0 }}>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack minWidth={0} spacing={0.35}>
            <Typography
              color={`${tone}.main`}
              fontWeight={850}
              letterSpacing="0.08em"
              textTransform="uppercase"
              variant="caption"
            >
              {eyebrow}
            </Typography>
            <Typography fontWeight={950} letterSpacing="-0.025em" variant="h6">
              {title}
            </Typography>
            <Typography color="text.secondary" fontSize={12.5} lineHeight={1.35}>
              {description}
            </Typography>
          </Stack>
          {action}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
}

function ProductSearchPrototype() {
  return (
    <OperationPanel
      action={
        <Chip
          color="success"
          label="5 visibles"
          size="small"
          sx={{ flex: "0 0 auto", fontWeight: 850 }}
        />
      }
      description="Tarjetas compactas: toca cualquier producto para agregarlo al ticket. La búsqueda no agrega productos automáticamente con Enter."
      eyebrow="Venta"
      title="Elegir productos"
      tone="primary"
    >
      <SalesToolbarPrototype />
      <Box
        sx={{
          display: "grid",
          gap: 0.55,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
        }}
      >
        {saleProducts.map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </Box>
    </OperationPanel>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" fontSize={11.5} fontWeight={850}>
        {label}
      </Typography>
      <Typography fontSize={13.5} fontWeight={950}>
        {value}
      </Typography>
    </Box>
  );
}

function TicketPrototype() {
  return (
    <OperationPanel
      action={
        <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.8}>
          <IconTile icon={AddShoppingCartIcon} size={38} tone="info" />
          <Chip
            color="primary"
            icon={<ReceiptLongIcon />}
            label="3 artículos"
            size="small"
            sx={{ flex: "0 0 auto", fontWeight: 850 }}
          />
        </Stack>
      }
      description="Cantidades, stock e importes quedan visibles antes de cobrar."
      eyebrow="Ticket"
      title="Ticket"
      tone="info"
    >
      <Box sx={{ display: "grid", gap: 1 }}>
        {ticketRows.map((item) => (
          <Box
            key={item.sku}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(0, 1.25fr) 88px",
                xl: "1fr",
              },
              p: 1.05,
              alignItems: "center",
            }}
          >
            <Stack minWidth={0} spacing={0.3}>
              <Typography fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                {item.name}
              </Typography>
              <Typography color="text.secondary" fontSize={12.5}>
                {item.sku} · Stock {item.stock}
              </Typography>
              <Typography color="text.secondary" fontSize={12.5}>
                {formatCurrency(item.price)} por unidad
              </Typography>
            </Stack>
            <Stack spacing={0.7}>
              <TextField
                label="Cantidad"
                size="small"
                value={String(item.quantity)}
              />
              <MiniField
                label="Importe"
                value={formatCurrency(item.price * item.quantity)}
              />
            </Stack>
          </Box>
        ))}
      </Box>

      <Box
        sx={(theme) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.16),
          borderRadius: 3,
          p: 1.1,
        })}
      >
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography color="text.secondary" fontWeight={850}>
            Total del ticket
          </Typography>
          <Typography fontSize={22} fontWeight={950}>
            {formatCurrency(saleTotal)}
          </Typography>
        </Stack>
      </Box>
    </OperationPanel>
  );
}

function CheckoutPrototype() {
  const theme = useTheme();

  return (
    <OperationPanel
      action={
        <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.8}>
          <IconTile icon={ShoppingCartIcon} size={38} tone="success" />
          <Chip
            color="success"
            icon={<LocalAtmIcon />}
            label={`Cambio ${formatCurrency(saleChange)}`}
            size="small"
            sx={{ flex: "0 0 auto", fontWeight: 850 }}
          />
        </Stack>
      }
      description="El cobro queda debajo del ticket y solo se habilita cuando el pago cubre el total."
      eyebrow="Cobro"
      title="Cobrar"
      tone="success"
    >
      <Box
        sx={{
          border: "1px solid",
          borderColor: alpha(theme.palette.success.main, 0.22),
          borderRadius: 3.25,
          background: `linear-gradient(145deg, ${alpha(theme.palette.success.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.86)})`,
          p: 1.35,
        }}
      >
        <Stack spacing={1.2}>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography color="text.secondary" fontWeight={850}>
              Total a cobrar
            </Typography>
            <Typography
              color="success.main"
              fontSize={30}
              fontWeight={950}
              lineHeight={1}
            >
              {formatCurrency(saleTotal)}
            </Typography>
          </Stack>
          <Divider />
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr" },
            }}
          >
            <TextField label="Método" select size="small" value="CASH">
              <MenuItem value="CASH">Efectivo</MenuItem>
              <MenuItem value="CARD">Tarjeta</MenuItem>
              <MenuItem value="TRANSFER">Transferencia</MenuItem>
            </TextField>
            <TextField
              label="Pago recibido"
              size="small"
              value={formatCurrency(paidAmount)}
            />
          </Box>
          <Stack
            alignItems="center"
            direction={{ xs: "column", sm: "row", xl: "column" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Chip
              color="success"
              icon={<CheckCircleIcon />}
              label="Pago suficiente"
              sx={{ alignSelf: { xs: "stretch", sm: "center", xl: "stretch" }, fontWeight: 850 }}
            />
            <Typography color="text.secondary" fontSize={12.5} fontWeight={850}>
              Cambio calculado automáticamente
            </Typography>
          </Stack>
          <Button
            fullWidth
            size="large"
            startIcon={<PaymentsIcon />}
            variant="contained"
          >
            Registrar venta
          </Button>
        </Stack>
      </Box>

      <Stack spacing={0.9}>
        <Chip
          color="info"
          icon={<CreditCardIcon />}
          label="No requiere caja abierta"
          sx={{ alignSelf: "flex-start", fontWeight: 850 }}
        />
        <Typography color="text.secondary" fontSize={12.5}>
          El efectivo se reporta como venta del vendedor. Liquidaciones o
          entregas de dinero pueden manejarse en otro módulo sin bloquear la
          venta.
        </Typography>
      </Stack>
    </OperationPanel>
  );
}

function SalesWorkspacePrototype() {
  return (
    <Surface>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          spacing={1.2}
        >
          <SectionHeader
            description="Una sola zona de trabajo: productos compactos a la izquierda y cobro/ticket a la derecha. El vendedor puede avanzar de selección a pago sin perder contexto."
            eyebrow="Operación"
            title="Venta en curso"
          />
          <Chip
            color="success"
            label="Almacén principal · productos vendibles"
            sx={{ alignSelf: { xs: "flex-start", lg: "center" }, fontWeight: 900 }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.2fr) minmax(332px, 0.8fr)",
              xl: "minmax(0, 1.24fr) minmax(350px, 0.76fr)",
            },
            alignItems: "start",
          }}
        >
          <ProductSearchPrototype />
          <Stack spacing={1.2}>
            <CheckoutPrototype />
            <TicketPrototype />
          </Stack>
        </Box>

        <Box
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.info.main, 0.06),
            border: "1px solid",
            borderColor: alpha(theme.palette.info.main, 0.18),
            borderRadius: 3,
            p: 1.15,
          })}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
            <Typography color="text.secondary" fontSize={12.5}>
              El almacén de salida se elige en su propia sección superior. Este bloque solo opera con los productos visibles de ese origen.
            </Typography>
            <Typography color="text.secondary" fontSize={12.5} fontWeight={850}>
              Sin caja obligatoria · stock validado por almacén
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function SalesBackofficePrototype() {
  const historyEvents = [
    ["Venta reciente", "María López · Ticket PV-1024 · $61.50", "success"],
    ["Venta registrada", "Ruta Centro · 3 artículos · efectivo", "success"],
    ["Pago insuficiente", "Bloqueado antes de registrar venta", "error"],
  ] as const;
  const adjustmentEvents = [
    [
      "Devolución pendiente",
      "Vendedor solicita devolver 1 producto",
      "warning",
    ],
    [
      "Cancelación aprobada",
      "Admin autorizó ajuste de ticket PV-1019",
      "success",
    ],
    ["Solicitud rechazada", "No procedió por falta de evidencia", "error"],
  ] as const;

  const EventGrid = ({
    events,
  }: {
    events: readonly (readonly [
      string,
      string,
      "success" | "warning" | "error",
    ])[];
  }) => (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
      }}
    >
      {events.map(([title, description, tone]) => (
        <Box
          key={title}
          sx={(theme) => ({
            border: "1px solid",
            borderColor: alpha(toneMain(theme, tone), 0.24),
            borderRadius: 3,
            backgroundColor: alpha(toneMain(theme, tone), 0.07),
            p: 1.2,
          })}
        >
          <Stack spacing={0.55}>
            <Stack alignItems="center" direction="row" spacing={0.75}>
              {tone === "success" ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : null}
              {tone === "warning" ? (
                <WarningAmberIcon color="warning" fontSize="small" />
              ) : null}
              {tone === "error" ? (
                <ErrorOutlineIcon color="error" fontSize="small" />
              ) : null}
              <Typography fontWeight={950}>{title}</Typography>
            </Stack>
            <Typography color="text.secondary" fontSize={12.5}>
              {description}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );

  return (
    <Surface>
      <Stack spacing={1.4}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1.2}
        >
          <SectionHeader
            description="El seguimiento queda fuera del flujo principal de venta. El usuario elige si quiere revisar ventas registradas o solicitudes pendientes."
            eyebrow="Seguimiento"
            title="Historial operativo"
          />
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
          >
            <Button variant="contained">Historial operativo</Button>
            <Button
              color="warning"
              startIcon={<AssignmentReturnIcon />}
              variant="outlined"
            >
              Solicitudes de ajuste
            </Button>
          </Stack>
        </Stack>

        <EventGrid events={historyEvents} />

        <Stack
          alignItems="center"
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography color="text.secondary" fontSize={12.5} fontWeight={850}>
            Mostrando 3 de 18 movimientos
          </Typography>
          <Stack direction="row" gap={1}>
            <Button disabled size="small" variant="outlined">
              Anterior
            </Button>
            <Button size="small" variant="outlined">
              Siguiente
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.05}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography
                color="warning.main"
                fontWeight={900}
                letterSpacing="0.08em"
                textTransform="uppercase"
                variant="caption"
              >
                Vista alternativa
              </Typography>
              <Typography fontWeight={950} variant="h6">
                Solicitudes de ajuste
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Misma sección, otra vista seleccionable con paginación propia.
              </Typography>
            </Box>
            <Chip
              color="warning"
              label="3 pendientes"
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                fontWeight: 900,
              }}
            />
          </Stack>
          <EventGrid events={adjustmentEvents} />
          <Stack
            alignItems="center"
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography color="text.secondary" fontSize={12.5} fontWeight={850}>
              Mostrando 3 de 9 solicitudes
            </Typography>
            <Stack direction="row" gap={1}>
              <Button disabled size="small" variant="outlined">
                Anterior
              </Button>
              <Button size="small" variant="outlined">
                Siguiente
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Surface>
  );
}
function MobileSalesPreview() {
  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="En móvil el vendedor necesita ver primero búsqueda, ticket y cobro. Las acciones administrativas quedan fuera del flujo primario."
          eyebrow="Responsive"
          title="Vista móvil 390 × 844"
        />
        <Box
          sx={(theme) => ({
            border: "10px solid",
            borderColor:
              theme.palette.mode === "dark" ? "grey.900" : "grey.300",
            borderRadius: 7,
            boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.18)}`,
            maxWidth: 390,
            mx: "auto",
            overflow: "hidden",
          })}
        >
          <Box sx={{ backgroundColor: "background.default", p: 1.35 }}>
            <Stack spacing={1.1}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography
                    color="text.secondary"
                    fontSize={11}
                    fontWeight={900}
                    textTransform="uppercase"
                  >
                    Venta móvil
                  </Typography>
                  <Typography fontWeight={950}>Ticket activo</Typography>
                </Box>
                <Chip
                  color="success"
                  label={formatCurrency(saleTotal)}
                  size="small"
                  sx={{ fontWeight: 850 }}
                />
              </Stack>

              <TextField
                placeholder="Buscar SKU o código"
                size="small"
                fullWidth
              />

              <Box sx={{ display: "grid", gap: 0.8 }}>
                {saleProducts.slice(0, 2).map((product) => (
                  <Box
                    key={product.sku}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2.4,
                      p: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Stack minWidth={0}>
                        <Typography fontSize={13.5} fontWeight={950} noWrap>
                          {product.name}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          fontSize={11.5}
                          noWrap
                        >
                          {product.sku} · Stock {product.stock}
                        </Typography>
                      </Stack>
                      <Typography fontSize={13.5} fontWeight={950}>
                        {formatCurrency(product.price)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    color="text.secondary"
                    fontSize={12}
                    fontWeight={850}
                  >
                    2 partidas · 3 artículos
                  </Typography>
                  <Typography fontSize={12} fontWeight={950}>
                    Pago suficiente
                  </Typography>
                </Stack>
                <Button fullWidth sx={{ mt: 1 }} variant="contained">
                  Registrar venta
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Surface>
  );
}

function DesignTokenSummary() {
  const tokens = [
    ["Grid desktop", "Productos + ticket/cobro"],
    ["Grid móvil", "Ticket y cobro debajo"],
    ["Acción primaria", "Registrar venta"],
    ["Lenguaje", "Vendedor, no cajero"],
  ];

  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Estos criterios mantienen continuidad con Inventario y Productos: superficies compactas, controles agrupados, métricas claras y lectura móvil real."
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

function SalesEditablePrototype() {
  return (
    <Stack spacing={2}>
      <SalesSourcePanel />
      <SalesWorkspacePrototype />
      <SalesBackofficePrototype />
      <MobileSalesPreview />
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
            ? "radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 34%), #070f1d"
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
              <Chip label="Ventas" variant="outlined" />
              <Chip label="No toca backend" variant="outlined" />
              <Chip label="Sin caja obligatoria" variant="outlined" />
              <Chip label="Dev-only" variant="outlined" />
            </Stack>
            <SectionHeader
              description="Prototipo ejecutable para revisar Ventas antes de tocar la página real. Conserva el flujo original de venta, con productos a la izquierda y ticket/cobro agrupados a la derecha."
              eyebrow="Punta Venta"
              title="Laboratorio visual de Ventas"
            />
          </Stack>
        </Surface>

        <SalesEditablePrototype />
      </Stack>
    </Box>
  );
}
