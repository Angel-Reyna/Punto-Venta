import type { Request, Response } from "express";
import PDFDocument from "pdfkit";

import {
  getOperationsReport,
  parseReportDateRange,
  type OperationsReport
} from "./reports.service";

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString("es-MX");
}

function saleStatusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Completadas";
    case "CANCELLED":
      return "Canceladas";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devueltas";
    default:
      return status;
  }
}

function paymentMethodLabel(method: string) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER":
      return "Transferencia";
    case "MIXED":
      return "Mixto";
    default:
      return method;
  }
}

function cashMovementLabel(type: string) {
  switch (type) {
    case "OPENING":
      return "Aperturas";
    case "CASH_IN":
      return "Entradas manuales";
    case "CASH_OUT":
      return "Salidas manuales";
    case "SALE_CASH":
      return "Ventas en efectivo";
    case "RETURN_CASH":
      return "Devoluciones en efectivo";
    default:
      return type;
  }
}

function writeKeyValueLines(
  doc: PDFKit.PDFDocument,
  entries: Array<[string, string | number]>,
  emptyLabel: string
) {
  if (entries.length === 0) {
    doc.text(emptyLabel);
    return;
  }

  for (const [label, value] of entries) {
    doc.text(`${label}: ${value}`);
  }
}

function ensurePdfSpace(doc: PDFKit.PDFDocument, requiredHeight = 90) {
  if (doc.y + requiredHeight >= doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function writeOperationsPdf(doc: PDFKit.PDFDocument, report: OperationsReport) {
  doc.fontSize(20).text("Reporte operativo", {
    align: "center"
  });

  doc.moveDown();

  doc.fontSize(10).text(`Desde: ${report.fromLabel}`);
  doc.text(`Hasta: ${report.toLabel}`);
  doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`);

  doc.moveDown();

  doc.fontSize(14).text("Resumen financiero");
  doc.moveDown(0.35);
  doc.fontSize(10);
  doc.text(`Ventas registradas: ${report.sales.count}`);
  doc.text(`Venta bruta: ${formatMoney(report.sales.gross)}`);
  doc.text(`Devoluciones: ${formatMoney(report.sales.refunded)}`);
  doc.text(`Venta neta: ${formatMoney(report.sales.net)}`);

  doc.moveDown();

  doc.fontSize(12).text("Ventas por estado");
  doc.moveDown(0.35);
  writeKeyValueLines(
    doc.fontSize(10),
    Object.entries(report.sales.byStatus).map(([status, count]) => [
      saleStatusLabel(status),
      count
    ]),
    "Sin ventas en el periodo"
  );

  doc.moveDown();

  doc.fontSize(12).text("Ventas por vendedor");
  doc.moveDown(0.35);

  if (report.sales.bySeller.length === 0) {
    doc.fontSize(10).text("Sin ventas por vendedor en el periodo.");
  } else {
    report.sales.bySeller.forEach((item) => {
      ensurePdfSpace(doc, 60);
      doc
        .fontSize(10)
        .text(
          `${item.seller.name} (${item.seller.email}) · ${item.count} ventas · ` +
            `Bruto ${formatMoney(item.gross)} · Devoluciones ${formatMoney(item.refunded)} · ` +
            `Neto ${formatMoney(item.net)}`
        );
    });
  }

  doc.moveDown();

  doc.fontSize(12).text("Cobros por método");
  doc.moveDown(0.35);
  writeKeyValueLines(
    doc.fontSize(10),
    Object.entries(report.sales.paymentSummary).map(([method, amount]) => [
      paymentMethodLabel(method),
      formatMoney(amount)
    ]),
    "Sin cobros registrados"
  );

  doc.moveDown();

  doc.fontSize(12).text("Devoluciones por método");
  doc.moveDown(0.35);
  writeKeyValueLines(
    doc.fontSize(10),
    Object.entries(report.returns.byMethod).map(([method, amount]) => [
      paymentMethodLabel(method),
      formatMoney(amount)
    ]),
    "Sin devoluciones registradas"
  );

  doc.moveDown();

  doc.fontSize(12).text("Movimientos de caja");
  doc.moveDown(0.35);
  writeKeyValueLines(
    doc.fontSize(10),
    Object.entries(report.cashRegister.movements.summary).map(([type, amount]) => [
      cashMovementLabel(type),
      formatMoney(amount)
    ]),
    "Sin movimientos de caja"
  );

  doc.moveDown();
  ensurePdfSpace(doc, 130);

  doc.fontSize(14).text("Productos más vendidos netos");
  doc.moveDown(0.35);
  doc.fontSize(10);

  if (report.topProducts.length === 0) {
    doc.text("Sin productos vendidos en el periodo.");
  } else {
    report.topProducts.forEach((item, index) => {
      ensurePdfSpace(doc, 40);
      doc.text(
        `${index + 1}. ${item.product.sku ?? "—"} · ${item.product.name} · ` +
          `${item.quantity} uds · ${formatMoney(item.total)}`
      );
    });
  }

  doc.moveDown();
  ensurePdfSpace(doc, 130);

  doc.fontSize(14).text("Ventas recientes");
  doc.moveDown(0.35);

  if (report.sales.recent.length === 0) {
    doc.fontSize(10).text("Sin ventas en el periodo.");
  } else {
    report.sales.recent.slice(0, 30).forEach((sale) => {
      ensurePdfSpace(doc, 85);
      const payments = sale.payments
        .map(
          (payment) =>
            `${paymentMethodLabel(payment.method)} ${formatMoney(payment.amount)}`
        )
        .join(", ");

      doc.fontSize(10).text(`Folio: ${sale.folio}`);
      doc.text(`Fecha: ${formatDate(sale.createdAt)}`);
      doc.text(`Estado: ${saleStatusLabel(sale.status)}`);
      doc.text(`Vendedor: ${sale.cashier.name} (${sale.cashier.email})`);
      doc.text(`Pagos: ${payments || "—"}`);
      doc.text(`Total: ${formatMoney(sale.total)}`);
      doc.moveDown(0.6);
    });
  }

  doc.moveDown();
  ensurePdfSpace(doc, 130);

  doc.fontSize(14).text("Devoluciones recientes");
  doc.moveDown(0.35);

  if (report.returns.latest.length === 0) {
    doc.fontSize(10).text("Sin devoluciones en el periodo.");
  } else {
    report.returns.latest.slice(0, 20).forEach((saleReturn) => {
      ensurePdfSpace(doc, 75);
      doc.fontSize(10).text(`Fecha: ${formatDate(saleReturn.createdAt)}`);
      doc.text(
        `Responsable: ${saleReturn.cashier.name} (${saleReturn.cashier.email})`
      );
      doc.text(`Método: ${paymentMethodLabel(saleReturn.refundMethod)}`);
      doc.text(`Total devuelto: ${formatMoney(saleReturn.refundTotal)}`);
      doc.text(`Motivo: ${saleReturn.reason}`);
      doc.moveDown(0.6);
    });
  }
}

export async function streamOperationsPdf(req: Request, res: Response) {
  const range = parseReportDateRange(req.query.from, req.query.to);
  const report = await getOperationsReport(range);
  const filename = `reporte-operativo-${report.fromLabel}-${report.toLabel}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    info: {
      Title: "Reporte operativo Punta Venta"
    }
  });

  doc.pipe(res);
  writeOperationsPdf(doc, report);
  doc.end();
}
