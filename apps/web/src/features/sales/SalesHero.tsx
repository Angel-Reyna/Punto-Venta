import { Chip } from "@mui/material";

import { PageHero } from "../../components/layout";

import { formatMoney } from "./salesShared";

export type SalesHeroProps = {
  cartItemsCount: number;
  cartLinesCount: number;
  filteredProductsCount: number;
  isPaymentInsufficient: boolean;
  normalizedPaid: number;
  total: number;
};

export function SalesHero({
  cartItemsCount,
  cartLinesCount,
  filteredProductsCount,
  isPaymentInsufficient,
  normalizedPaid,
  total,
}: SalesHeroProps) {
  const hasTicket = cartLinesCount > 0;
  const paymentGap = Math.max(total - normalizedPaid, 0);

  const ticketStatus = !hasTicket
    ? "Sin ticket"
    : isPaymentInsufficient
      ? `Falta ${formatMoney(paymentGap)}`
      : "Listo para cobrar";

  return (
    <PageHero
      testId="sales-visual-hero"
      tone={hasTicket && !isPaymentInsufficient ? "success" : "info"}
      eyebrow={<Chip size="small" color="primary" variant="outlined" label="Flujo de venta operativo" />}
      title="Venta por pasos"
      subtitle="Busca productos, revisa el ticket y cobra solo cuando el pago cubra el total. En móvil se lee como flujo; en PC funciona como estación de venta."
      stats={[
        {
          label: "Artículos",
          value: `${cartItemsCount} ${cartItemsCount === 1 ? "artículo" : "artículos"}`,
        },
        {
          label: "Estado",
          value: ticketStatus,
        },
        {
          label: "Productos visibles",
          value: filteredProductsCount,
        },
      ]}
    />
  );
}
