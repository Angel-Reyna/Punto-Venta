import type { Request, Response } from "express";
import PDFDocument from "pdfkit";

import {
  getOperationsReport,
  parseReportDateRange,
  type OperationsReport
} from "./reports.service";

const COLORS = {
  amber: "#b45309",
  amberSoft: "#fef3c7",
  border: "#d9e2ec",
  danger: "#b91c1c",
  dangerSoft: "#fee2e2",
  dark: "#102033",
  dark2: "#1f2f46",
  green: "#047857",
  greenSoft: "#dcfce7",
  ink: "#111827",
  muted: "#64748b",
  primary: "#2563eb",
  primary2: "#7c3aed",
  primarySoft: "#dbeafe",
  soft: "#f8fafc",
  tableHeader: "#e8eef7",
  white: "#ffffff"
} as const;

const MARGIN = 40;
const ROW_X_PADDING = 5;
const ROW_Y_PADDING = 5;
const PAGE_HEADER_HEIGHT = 32;

type Column<T> = {
  align?: "left" | "center" | "right";
  header: string;
  value: (row: T, index: number) => string | number;
  width: number;
};

type BarRow = {
  helper?: string;
  label: string;
  value: number;
};

type Tone = "danger" | "primary" | "success" | "warning";

class ReportCursor {
  private page = 1;

  constructor(public readonly doc: PDFKit.PDFDocument, private readonly report: OperationsReport) {}

  get pageNumber() {
    return this.page;
  }

  get left() {
    return this.doc.page.margins.left;
  }

  get right() {
    return this.doc.page.width - this.doc.page.margins.right;
  }

  get top() {
    return this.doc.page.margins.top;
  }

  get bottom() {
    return this.doc.page.height - this.doc.page.margins.bottom - 18;
  }

  get width() {
    return this.right - this.left;
  }

  drawChrome(firstPage = false) {
    const { doc } = this;
    const savedX = doc.x;
    const savedY = doc.y;

    if (!firstPage) {
      doc
        .fillColor(COLORS.muted)
        .font("Helvetica-Bold")
        .fontSize(7.2)
        .text(`Punta Venta · Reporte operativo · ${this.report.fromLabel} al ${this.report.toLabel}`, this.left, 24, {
          lineBreak: false,
          width: this.width
        });
      doc
        .moveTo(this.left, 38)
        .lineTo(this.right, 38)
        .strokeColor(COLORS.border)
        .lineWidth(0.4)
        .stroke();
    }

    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(`Uso interno · Página ${this.page}`, this.left, doc.page.height - doc.page.margins.bottom - 12, {
        align: "center",
        lineBreak: false,
        width: this.width
      });

    doc.x = savedX;
    doc.y = savedY;
  }

  addPage() {
    this.doc.addPage();
    this.page += 1;
    this.doc.x = this.left;
    this.doc.y = this.top + PAGE_HEADER_HEIGHT;
    this.drawChrome(false);
  }

  ensure(height: number) {
    if (this.doc.y + height > this.bottom) {
      this.addPage();
    }
  }

  move(height: number) {
    this.doc.y += height;
  }
}

function formatMoney(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : `$${Number(value).toFixed(2)}`;
}

function formatPercent(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("es-MX");
}

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("es-MX") : "-";
}

function text(value: string | number | null | undefined) {
  const printable = Array.from(String(value ?? "-"))
    .map((char) => {
      const code = char.charCodeAt(0);

      return code < 32 || code === 127 ? " " : char;
    })
    .join("");

  return printable.replace(/\s+/g, " ").trim() || "-";
}

function truncate(value: string | number | null | undefined, maxLength: number) {
  const valueText = text(value);

  return valueText.length > maxLength ? `${valueText.slice(0, Math.max(0, maxLength - 1))}…` : valueText;
}

function percentOf(value: number, total: number) {
  return total <= 0 ? 0 : (value / total) * 100;
}

function toneColor(tone: Tone) {
  switch (tone) {
    case "danger":
      return COLORS.danger;
    case "success":
      return COLORS.green;
    case "warning":
      return COLORS.amber;
    default:
      return COLORS.primary;
  }
}

function toneBackground(tone: Tone) {
  switch (tone) {
    case "danger":
      return COLORS.dangerSoft;
    case "success":
      return COLORS.greenSoft;
    case "warning":
      return COLORS.amberSoft;
    default:
      return COLORS.primarySoft;
  }
}

function saleStatusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devuelta";
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


function inventoryMovementTypeLabel(type: string) {
  switch (type) {
    case "IN":
      return "Entrada";
    case "OUT":
      return "Salida";
    default:
      return type;
  }
}

function inventoryReasonTypeLabel(reasonType: string) {
  switch (reasonType) {
    case "EXPIRATION":
      return "Caducidad";
    case "DAMAGE":
      return "Daños";
    case "OTHER":
      return "Otros";
    default:
      return reasonType;
  }
}

function activeSalesCount(report: OperationsReport) {
  return Math.max(
    0,
    report.sales.activeCount ?? report.sales.count - (report.sales.byStatus.CANCELLED ?? 0)
  );
}

function paymentTotal(summary: Record<string, number>) {
  return Object.values(summary).reduce((sum, amount) => sum + Number(amount), 0);
}

function operatingProfit(report: OperationsReport) {
  return report.sales.profit.operatingProfit ?? report.sales.profit.netProfit - report.inventory.shrinkage.totalCost;
}

function operatingMarginPercent(report: OperationsReport) {
  return report.sales.profit.operatingMarginPercent ?? percentOf(operatingProfit(report), report.sales.net);
}

function topSeller(report: OperationsReport) {
  return report.sales.bySeller[0];
}

function topPaymentMethod(report: OperationsReport) {
  return Object.entries(report.sales.paymentSummary).sort((a, b) => b[1] - a[1])[0];
}


function drawHero(cursor: ReportCursor, report: OperationsReport, generatedAt: Date) {
  const { doc } = cursor;
  const x = cursor.left;
  const y = doc.y;
  const heroHeight = 118;
  const metaWidth = 164;

  cursor.ensure(heroHeight + 14);
  doc.roundedRect(x, y, cursor.width, heroHeight, 12).fill(COLORS.dark);
  doc.rect(x, y, 8, heroHeight).fill(COLORS.primary2);

  doc
    .fillColor("#c4b5fd")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("PUNTA VENTA", x + 24, y + 18, { characterSpacing: 1.4, lineBreak: false, width: 160 });
  doc
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("Reporte de ventas", x + 24, y + 36, { lineBreak: false, width: cursor.width - metaWidth - 58 });
  doc
    .fillColor("#cbd5e1")
    .font("Helvetica")
    .fontSize(9)
    .text("Resumen ejecutivo, KPIs, ranking de vendedores, productos y detalle operativo del periodo.", x + 24, y + 70, {
      width: cursor.width - metaWidth - 58
    });
  doc
    .fillColor("#dbeafe")
    .fontSize(8)
    .text("Las ventas se registran sin depender de un módulos adicionales.", x + 24, y + 96, {
      lineBreak: false,
      width: cursor.width - metaWidth - 58
    });

  const metaX = x + cursor.width - metaWidth - 18;
  doc.roundedRect(metaX, y + 16, metaWidth, heroHeight - 32, 10).fill(COLORS.dark2);
  doc.fillColor("#93c5fd").font("Helvetica-Bold").fontSize(7.2).text("PERIODO", metaX + 12, y + 29, {
    lineBreak: false,
    width: metaWidth - 24
  });
  doc.fillColor(COLORS.white).fontSize(10).text(`${report.fromLabel} al ${report.toLabel}`, metaX + 12, y + 43, {
    lineBreak: false,
    width: metaWidth - 24
  });
  doc.fillColor("#93c5fd").fontSize(7.2).text("GENERADO", metaX + 12, y + 66, {
    lineBreak: false,
    width: metaWidth - 24
  });
  doc.fillColor(COLORS.white).font("Helvetica").fontSize(8).text(formatDate(generatedAt), metaX + 12, y + 80, {
    lineBreak: false,
    width: metaWidth - 24
  });

  doc.y = y + heroHeight + 16;
}

function drawSection(cursor: ReportCursor, title: string, subtitle?: string) {
  const { doc } = cursor;
  const height = subtitle ? 42 : 28;
  const x = cursor.left;
  const y = doc.y;

  cursor.ensure(height + 8);
  doc.roundedRect(x, y + 2, 5, subtitle ? 32 : 18, 2).fill(COLORS.primary);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(12).text(title, x + 14, y, {
    lineBreak: false,
    width: cursor.width - 14
  });

  if (subtitle) {
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text(subtitle, x + 14, y + 17, {
      lineGap: 1,
      width: cursor.width - 14
    });
  }

  doc.y = y + height;
}

function drawCards(
  cursor: ReportCursor,
  items: Array<{ helper: string; label: string; tone?: Tone; value: string | number }>,
  columns = 3
) {
  const { doc } = cursor;
  const gap = 9;
  const itemWidth = (cursor.width - gap * (columns - 1)) / columns;
  const itemHeight = 66;
  let x = cursor.left;
  let y = doc.y;

  items.forEach((item, index) => {
    if (index > 0 && index % columns === 0) {
      x = cursor.left;
      y += itemHeight + gap;
    }

    if (y + itemHeight > cursor.bottom) {
      cursor.addPage();
      x = cursor.left;
      y = doc.y;
    }

    const tone = item.tone ?? "primary";
    const accent = toneColor(tone);
    const background = toneBackground(tone);

    doc.roundedRect(x, y, itemWidth, itemHeight, 9).fillAndStroke(background, COLORS.border);
    doc.roundedRect(x, y, 5, itemHeight, 4).fill(accent);
    doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7).text(text(item.label).toUpperCase(), x + 13, y + 10, {
      lineBreak: false,
      width: itemWidth - 22
    });
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(13).text(text(item.value), x + 13, y + 27, {
      lineBreak: false,
      width: itemWidth - 22
    });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(6.8).text(text(item.helper), x + 13, y + 47, {
      lineBreak: false,
      width: itemWidth - 22
    });
    x += itemWidth + gap;
  });

  doc.y = y + itemHeight + 16;
}

function drawSummary(cursor: ReportCursor, report: OperationsReport) {
  const { doc } = cursor;
  const transactions = activeSalesCount(report);
  const avgTicket = transactions <= 0 ? 0 : report.sales.net / transactions;
  const refundRate = percentOf(report.sales.refunded, report.sales.gross);
  const seller = topSeller(report);
  const payment = topPaymentMethod(report);
  const totalPayments = paymentTotal(report.sales.paymentSummary);
  const x = cursor.left;
  const y = doc.y;
  const height = 118;
  const asideWidth = 162;

  cursor.ensure(height + 14);
  doc.roundedRect(x, y, cursor.width, height, 10).fillAndStroke(COLORS.soft, COLORS.border);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(13).text("Lectura ejecutiva", x + 16, y + 14, {
    lineBreak: false,
    width: cursor.width - asideWidth - 42
  });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8.4)
    .text(
      `El periodo registró ${formatMoney(report.sales.net)} de venta neta, ${formatMoney(report.sales.profit.netProfit)} de utilidad antes de merma y ${formatMoney(operatingProfit(report))} de utilidad operativa.`,
      x + 16,
      y + 35,
      { lineGap: 2, width: cursor.width - asideWidth - 42 }
    );
  doc
    .fillColor(COLORS.muted)
    .fontSize(8.4)
    .text(
      `Ticket promedio: ${formatMoney(avgTicket)}. Devoluciones sobre venta bruta: ${formatPercent(refundRate)}. Ventas activas: ${formatNumber(transactions)}. Merma de inventario: ${formatMoney(report.inventory.shrinkage.totalCost)}. Margen operativo: ${formatPercent(operatingMarginPercent(report))}.`,
      x + 16,
      y + 68,
      { lineGap: 2, width: cursor.width - asideWidth - 42 }
    );

  const asideX = x + cursor.width - asideWidth - 14;
  doc.roundedRect(asideX, y + 14, asideWidth, height - 28, 8).fill(COLORS.white);
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7).text("MEJOR VENDEDOR", asideX + 12, y + 25, {
    lineBreak: false,
    width: asideWidth - 24
  });
  doc.fillColor(COLORS.ink).fontSize(9).text(truncate(seller?.seller.name ?? "Sin ventas", 26), asideX + 12, y + 39, {
    lineBreak: false,
    width: asideWidth - 24
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.4).text(formatMoney(seller?.net ?? 0), asideX + 12, y + 54, {
    lineBreak: false,
    width: asideWidth - 24
  });
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7).text("MÉTODO PRINCIPAL", asideX + 12, y + 71, {
    lineBreak: false,
    width: asideWidth - 24
  });
  doc
    .fillColor(COLORS.ink)
    .fontSize(8.4)
    .text(
      payment ? `${paymentMethodLabel(payment[0])} · ${formatPercent(percentOf(payment[1], totalPayments))}` : "Sin cobros",
      asideX + 12,
      y + 85,
      { lineBreak: false, width: asideWidth - 24 }
    );

  doc.y = y + height + 16;
}

function drawBarPanel(
  cursor: ReportCursor,
  title: string,
  subtitle: string,
  rows: BarRow[],
  emptyLabel: string,
  formatter: (value: number) => string,
  options: { panelWidth: number; tone?: Tone; x: number; y: number }
) {
  const { doc } = cursor;
  const height = 182;
  const tone = options.tone ?? "primary";
  const accent = toneColor(tone);
  const safeRows = rows.slice(0, 5);
  const maxValue = Math.max(...safeRows.map((row) => Math.abs(row.value)), 0);

  doc.roundedRect(options.x, options.y, options.panelWidth, height, 9).fillAndStroke(COLORS.white, COLORS.border);
  doc.roundedRect(options.x, options.y, 5, height, 4).fill(accent);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10).text(title, options.x + 14, options.y + 12, {
    lineBreak: false,
    width: options.panelWidth - 28
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.2).text(subtitle, options.x + 14, options.y + 27, {
    lineBreak: false,
    width: options.panelWidth - 28
  });

  if (safeRows.length === 0 || maxValue <= 0) {
    doc.fillColor(COLORS.muted).fontSize(8).text(emptyLabel, options.x + 14, options.y + 66, {
      width: options.panelWidth - 28
    });
    return height;
  }

  let rowY = options.y + 50;
  safeRows.forEach((row) => {
    const contentWidth = options.panelWidth - 28;
    const chartWidth = contentWidth - 65;
    const chartX = options.x + 14;
    const pct = Math.max(0.04, Math.min(1, Math.abs(row.value) / maxValue));

    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(7.2).text(truncate(row.label, 31), chartX, rowY, {
      lineBreak: false,
      width: chartWidth
    });
    doc.fillColor(COLORS.muted).fontSize(7).text(formatter(row.value), chartX + chartWidth, rowY, {
      align: "right",
      lineBreak: false,
      width: 65
    });
    doc.roundedRect(chartX, rowY + 12, chartWidth, 5, 2.5).fill(COLORS.tableHeader);
    doc.roundedRect(chartX, rowY + 12, chartWidth * pct, 5, 2.5).fill(accent);

    if (row.helper) {
      doc.fillColor(COLORS.muted).fontSize(6.4).text(truncate(row.helper, 48), chartX, rowY + 18, {
        lineBreak: false,
        width: contentWidth
      });
    }

    rowY += 26;
  });

  return height;
}

function drawTrendPanel(
  cursor: ReportCursor,
  title: string,
  subtitle: string,
  rows: Array<{ label: string; value: number; helper?: string }>,
  emptyLabel: string,
  formatter: (value: number) => string,
  options: { panelWidth: number; tone?: Tone; x: number; y: number }
) {
  const { doc } = cursor;
  const height = 182;
  const tone = options.tone ?? "primary";
  const accent = toneColor(tone);
  const safeRows = rows.slice(-14);
  const maxValue = Math.max(...safeRows.map((row) => Math.abs(row.value)), 0);
  const chartX = options.x + 18;
  const chartY = options.y + 58;
  const chartWidth = options.panelWidth - 36;
  const chartHeight = 72;

  doc.roundedRect(options.x, options.y, options.panelWidth, height, 9).fillAndStroke(COLORS.white, COLORS.border);
  doc.roundedRect(options.x, options.y, 5, height, 4).fill(accent);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10).text(title, options.x + 14, options.y + 12, {
    lineBreak: false,
    width: options.panelWidth - 28
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.2).text(subtitle, options.x + 14, options.y + 27, {
    lineBreak: false,
    width: options.panelWidth - 28
  });

  if (safeRows.length === 0 || maxValue <= 0) {
    doc.fillColor(COLORS.muted).fontSize(8).text(emptyLabel, options.x + 14, options.y + 66, {
      width: options.panelWidth - 28
    });
    return height;
  }

  doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 4).fill(COLORS.soft);
  doc
    .moveTo(chartX, chartY + chartHeight)
    .lineTo(chartX + chartWidth, chartY + chartHeight)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();

  const gap = 4;
  const barWidth = Math.max(5, (chartWidth - gap * (safeRows.length + 1)) / safeRows.length);

  safeRows.forEach((row, index) => {
    const pct = Math.max(0.04, Math.min(1, Math.abs(row.value) / maxValue));
    const barHeight = Math.max(3, chartHeight * pct - 8);
    const x = chartX + gap + index * (barWidth + gap);
    const y = chartY + chartHeight - barHeight;

    doc.roundedRect(x, y, barWidth, barHeight, 2).fill(accent);

    if (index === 0 || index === safeRows.length - 1 || safeRows.length <= 7) {
      doc.fillColor(COLORS.muted).font("Helvetica").fontSize(5.8).text(row.label.slice(5), x - 4, chartY + chartHeight + 5, {
        align: "center",
        lineBreak: false,
        width: barWidth + 8
      });
    }
  });

  const total = safeRows.reduce((sum, row) => sum + row.value, 0);
  const best = [...safeRows].sort((a, b) => b.value - a.value)[0];

  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(8.2).text(`Total mostrado: ${formatter(total)}`, options.x + 14, options.y + 145, {
    lineBreak: false,
    width: options.panelWidth - 28
  });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(7)
    .text(best ? `Mayor día: ${best.label} · ${formatter(best.value)}` : "Sin máximo disponible", options.x + 14, options.y + 160, {
      lineBreak: false,
      width: options.panelWidth - 28
    });

  return height;
}

function drawTrendAndShrinkageGrid(cursor: ReportCursor, report: OperationsReport) {
  const { doc } = cursor;
  const gap = 10;
  const panelWidth = (cursor.width - gap) / 2;

  cursor.ensure(198);
  const y = doc.y;
  drawTrendPanel(
    cursor,
    "Tendencia diaria de venta neta",
    "Importe neto por día dentro del rango",
    report.sales.daily.map((day) => ({
      helper: `${formatNumber(day.count)} venta(s) · ${formatNumber(day.units)} uds.`,
      label: day.date,
      value: day.net
    })),
    "Sin ventas netas para graficar.",
    formatMoney,
    { panelWidth, tone: "success", x: cursor.left, y }
  );
  drawBarPanel(
    cursor,
    "Merma de inventario",
    "Costo perdido por caducidad o daños",
    report.inventory.shrinkage.byProduct.map((item) => ({
      helper: `${formatNumber(item.quantity)} unidad(es) retirada(s)`,
      label: item.product.name,
      value: item.cost
    })),
    "Sin merma de inventario en el periodo.",
    formatMoney,
    { panelWidth, tone: "danger", x: cursor.left + panelWidth + gap, y }
  );

  doc.y = y + 198;
}

function drawInventoryHighlights(cursor: ReportCursor, report: OperationsReport) {
  drawSection(
    cursor,
    "Inventario y merma",
    "Entradas, salidas y mermas por caducidad o daños registradas durante el periodo."
  );
  drawCards(
    cursor,
    [
      {
        label: "Entradas inventario",
        value: formatNumber(report.inventory.movements.unitsIn),
        helper: "Unidades agregadas"
      },
      {
        label: "Salidas inventario",
        value: formatNumber(report.inventory.movements.unitsOut),
        helper: "Unidades retiradas",
        tone: report.inventory.movements.unitsOut > 0 ? "warning" : "success"
      },
      {
        label: "Merma inventario",
        value: formatMoney(report.inventory.shrinkage.totalCost),
        helper: `${formatNumber(report.inventory.shrinkage.totalUnits)} unidad(es)`,
        tone: report.inventory.shrinkage.totalCost > 0 ? "danger" : "success"
      },
      {
        label: "Movimientos inventario",
        value: formatNumber(report.inventory.movements.count),
        helper: "Entradas y salidas"
      }
    ],
    4
  );

  drawKeyValue(
    cursor,
    "Inventario por tipo de movimiento",
    Object.entries(report.inventory.movements.byType).map(([type, quantity]) => [
      inventoryMovementTypeLabel(type),
      `${formatNumber(quantity)} unidad(es)`
    ]),
    "Sin movimientos de inventario en el periodo."
  );
  drawKeyValue(
    cursor,
    "Merma por almacén",
    report.inventory.shrinkage.byWarehouse.map((item) => [
      item.warehouse.name,
      `${formatMoney(item.cost)} · ${formatNumber(item.quantity)} unidad(es)`
    ]),
    "Sin merma por almacén en el periodo."
  );

  drawSection(
    cursor,
    "Mermas recientes",
    "Detalle de productos retirados por caducidad o daños con costo histórico capturado."
  );
  drawTable(
    cursor,
    [
      { header: "Fecha", value: (movement: OperationsReport["inventory"]["shrinkage"]["latest"][number]) => formatDate(movement.createdAt), width: 92 },
      { header: "Producto", value: (movement) => movement.product.name, width: 142 },
      { header: "Almacén", value: (movement) => movement.warehouse?.name ?? "Sin almacén", width: 86 },
      { align: "right", header: "Uds.", value: (movement) => movement.quantity, width: 45 },
      { align: "right", header: "Costo unit.", value: (movement) => formatMoney(movement.unitCostAtMovement), width: 70 },
      { align: "right", header: "Merma", value: (movement) => formatMoney(movement.costAmount), width: cursor.width - 92 - 142 - 86 - 45 - 70 }
    ],
    report.inventory.shrinkage.latest,
    "Sin mermas por caducidad o daños registradas en el periodo."
  );
}

function drawInsightGrid(cursor: ReportCursor, report: OperationsReport) {
  const { doc } = cursor;
  const gap = 10;
  const panelWidth = (cursor.width - gap) / 2;
  const totalPayments = paymentTotal(report.sales.paymentSummary);

  cursor.ensure(198);
  const y = doc.y;
  drawBarPanel(
    cursor,
    "Vendedores por venta neta",
    "Top del periodo con devoluciones descontadas",
    report.sales.bySeller.map((item) => ({
      helper: `${formatNumber(item.count)} venta(s) · Dev. ${formatMoney(item.refunded)}`,
      label: item.seller.name,
      value: item.net
    })),
    "Sin ventas por vendedor.",
    formatMoney,
    { panelWidth, tone: "success", x: cursor.left, y }
  );
  drawBarPanel(
    cursor,
    "Cobros por método",
    "Participación sobre cobros registrados",
    Object.entries(report.sales.paymentSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([method, amount]) => ({
        helper: `${formatPercent(percentOf(amount, totalPayments))} del total cobrado`,
        label: paymentMethodLabel(method),
        value: amount
      })),
    "Sin cobros registrados.",
    formatMoney,
    { panelWidth, tone: "primary", x: cursor.left + panelWidth + gap, y }
  );

  doc.y = y + 198;
}

function drawProductBars(cursor: ReportCursor, report: OperationsReport) {
  const { doc } = cursor;

  cursor.ensure(198);
  const y = doc.y;
  drawBarPanel(
    cursor,
    "Productos con mayor venta neta",
    "Top 5 por importe vendido y utilidad histórica",
    [...report.topProducts]
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        helper: `${formatNumber(item.quantity)} unidad(es) · Utilidad ${formatMoney(item.grossProfit)}`,
        label: item.product.name,
        value: item.total
      })),
    "Sin productos vendidos.",
    formatMoney,
    { panelWidth: cursor.width, tone: "warning", x: cursor.left, y }
  );
  doc.y = y + 198;
}

function drawTableHeader<T>(cursor: ReportCursor, columns: Array<Column<T>>) {
  const { doc } = cursor;
  const y = doc.y;
  let x = cursor.left;

  doc.roundedRect(x, y, cursor.width, 22, 3).fill(COLORS.dark);
  columns.forEach((column) => {
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(7.2).text(column.header, x + ROW_X_PADDING, y + 7, {
      align: column.align ?? "left",
      lineBreak: false,
      width: column.width - ROW_X_PADDING * 2
    });
    x += column.width;
  });

  doc.y = y + 22;
}

function tableRowHeight<T>(doc: PDFKit.PDFDocument, columns: Array<Column<T>>, row: T, index: number) {
  doc.font("Helvetica").fontSize(7.7);

  return Math.max(
    24,
    ...columns.map(
      (column) =>
        doc.heightOfString(truncate(column.value(row, index), 95), {
          lineGap: 1,
          width: column.width - ROW_X_PADDING * 2
        }) + ROW_Y_PADDING * 2
    )
  );
}

function drawTable<T>(cursor: ReportCursor, columns: Array<Column<T>>, rows: T[], emptyLabel: string) {
  const { doc } = cursor;

  if (rows.length === 0) {
    cursor.ensure(28);
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8.6).text(emptyLabel, cursor.left, doc.y, {
      width: cursor.width
    });
    doc.y += 14;
    return;
  }

  cursor.ensure(48);
  drawTableHeader(cursor, columns);

  rows.forEach((row, index) => {
    const height = tableRowHeight(doc, columns, row, index);

    cursor.ensure(height + 24);
    if (doc.y < cursor.top + PAGE_HEADER_HEIGHT + 4 && cursor.pageNumber > 1) {
      drawTableHeader(cursor, columns);
    }

    const y = doc.y;
    let x = cursor.left;
    doc.rect(x, y, cursor.width, height).fill(index % 2 === 0 ? COLORS.white : COLORS.soft);
    doc
      .moveTo(x, y + height)
      .lineTo(cursor.right, y + height)
      .strokeColor(COLORS.border)
      .lineWidth(0.35)
      .stroke();

    columns.forEach((column) => {
      doc.fillColor(COLORS.ink).font("Helvetica").fontSize(7.7).text(truncate(column.value(row, index), 95), x + ROW_X_PADDING, y + ROW_Y_PADDING, {
        align: column.align ?? "left",
        lineGap: 1,
        width: column.width - ROW_X_PADDING * 2
      });
      x += column.width;
    });

    doc.y = y + height;
  });

  doc.y += 12;
}

function drawKeyValue(cursor: ReportCursor, title: string, entries: Array<[string, string | number]>, emptyLabel: string) {
  drawSection(cursor, title);
  drawTable(
    cursor,
    [
      { header: "Concepto", value: (row: [string, string | number]) => row[0], width: 275 },
      { align: "right", header: "Valor", value: (row) => row[1], width: cursor.width - 275 }
    ],
    entries,
    emptyLabel
  );
}

export function writeOperationsPdf(doc: PDFKit.PDFDocument, report: OperationsReport, generatedAt = new Date()) {
  const cursor = new ReportCursor(doc, report);
  doc.y = doc.page.margins.top;
  cursor.drawChrome(true);

  drawHero(cursor, report, generatedAt);
  drawSummary(cursor, report);

  drawSection(cursor, "Indicadores principales", "Lectura rápida para el dueño/admin antes de revisar tablas de detalle.");
  drawCards(cursor, [
    { label: "Ventas activas", value: activeSalesCount(report), helper: "Excluye canceladas" },
    { label: "Venta bruta", value: formatMoney(report.sales.gross), helper: "Ventas no canceladas", tone: "success" },
    { label: "Venta neta", value: formatMoney(report.sales.net), helper: "Bruta menos devoluciones", tone: "success" },
    { label: "Unidades netas", value: formatNumber(report.sales.unitsNet), helper: "Vendidas menos devueltas" },
    { label: "UPT", value: formatNumber(report.sales.unitsPerTransaction), helper: "Unidades / venta activa" },
    { label: "Utilidad antes de merma", value: formatMoney(report.sales.profit.netProfit), helper: "Venta neta menos costo", tone: "success" },
    {
      label: "Utilidad operativa",
      value: formatMoney(operatingProfit(report)),
      helper: "Utilidad menos merma",
      tone: operatingProfit(report) < 0 ? "danger" : "success"
    },
    { label: "Margen bruto", value: formatPercent(report.sales.profit.marginPercent), helper: "Antes de merma", tone: "success" },
    {
      label: "Margen operativo",
      value: formatPercent(operatingMarginPercent(report)),
      helper: "Después de merma",
      tone: operatingMarginPercent(report) < 0 ? "danger" : "success"
    },
    {
      label: "Devoluciones",
      value: formatMoney(report.sales.refunded),
      helper: `${formatNumber(report.returns.count)} operación(es)`,
      tone: report.sales.refunded > 0 ? "warning" : "success"
    },
    {
      label: "Ticket promedio",
      value: formatMoney(activeSalesCount(report) <= 0 ? 0 : report.sales.net / activeSalesCount(report)),
      helper: "Venta neta / ventas activas"
    },
    {
      label: "Merma inventario",
      value: formatMoney(report.inventory.shrinkage.totalCost),
      helper: `${formatNumber(report.inventory.shrinkage.totalUnits)} unidad(es)`,
      tone: report.inventory.shrinkage.totalCost > 0 ? "danger" : "success"
    },
    {
      label: "Efectivo",
      value: formatPercent(percentOf(report.sales.paymentSummary.CASH ?? 0, paymentTotal(report.sales.paymentSummary))),
      helper: "Participación en cobros"
    }
  ]);

  drawInsightGrid(cursor, report);
  drawTrendAndShrinkageGrid(cursor, report);
  drawProductBars(cursor, report);

  drawSection(cursor, "Ventas por vendedor", "Las devoluciones se atribuyen al vendedor original de la venta.");
  drawTable(
    cursor,
    [
      { header: "Vendedor", value: (item: OperationsReport["sales"]["bySeller"][number]) => `${item.seller.name} · ${item.seller.email}`, width: 216 },
      { align: "right", header: "Ventas", value: (item) => item.count, width: 48 },
      { align: "right", header: "Bruto", value: (item) => formatMoney(item.gross), width: 78 },
      { align: "right", header: "Dev.", value: (item) => formatMoney(item.refunded), width: 76 },
      { align: "right", header: "Neto", value: (item) => formatMoney(item.net), width: cursor.width - 216 - 48 - 78 - 76 }
    ],
    report.sales.bySeller,
    "Sin ventas por vendedor en el periodo."
  );

  drawKeyValue(cursor, "Ventas por estado", Object.entries(report.sales.byStatus).map(([status, count]) => [saleStatusLabel(status), count]), "Sin ventas en el periodo.");
  drawKeyValue(cursor, "Cobros por método", Object.entries(report.sales.paymentSummary).map(([method, amount]) => [paymentMethodLabel(method), formatMoney(amount)]), "Sin cobros registrados.");
  drawKeyValue(cursor, "Devoluciones por método", Object.entries(report.returns.byMethod).map(([method, amount]) => [paymentMethodLabel(method), formatMoney(amount)]), "Sin devoluciones registradas.");

  drawSection(cursor, "Productos más vendidos netos", "Unidades, venta neta, costo histórico y utilidad después de devoluciones.");
  drawTable(
    cursor,
    [
      { align: "center", header: "#", value: (_item: OperationsReport["topProducts"][number], index) => index + 1, width: 28 },
      { header: "SKU", value: (item) => item.product.sku ?? "-", width: 60 },
      { header: "Producto", value: (item) => item.product.name, width: 154 },
      { align: "right", header: "Uds.", value: (item) => item.quantity, width: 45 },
      { align: "right", header: "Vendido", value: (item) => formatMoney(item.total), width: 74 },
      { align: "right", header: "Costo", value: (item) => formatMoney(item.cost), width: 72 },
      { align: "right", header: "Utilidad", value: (item) => formatMoney(item.grossProfit), width: cursor.width - 28 - 60 - 154 - 45 - 74 - 72 }
    ],
    report.topProducts,
    "Sin productos vendidos en el periodo."
  );

  drawInventoryHighlights(cursor, report);

  drawSection(cursor, "Ventas recientes", "Últimas ventas del periodo con folio, estado, vendedor, pagos y total.");
  drawTable(
    cursor,
    [
      { header: "Folio", value: (sale: OperationsReport["sales"]["recent"][number]) => sale.folio, width: 78 },
      { header: "Fecha", value: (sale) => formatDate(sale.createdAt), width: 92 },
      { header: "Estado", value: (sale) => saleStatusLabel(sale.status), width: 78 },
      { header: "Vendedor", value: (sale) => sale.cashier.name, width: 92 },
      { header: "Pagos", value: (sale) => sale.payments.map((payment) => `${paymentMethodLabel(payment.method)} ${formatMoney(payment.amount)}`).join(", ") || "-", width: 106 },
      { align: "right", header: "Total", value: (sale) => formatMoney(sale.total), width: cursor.width - 78 - 92 - 78 - 92 - 106 }
    ],
    report.sales.recent.slice(0, 30),
    "Sin ventas en el periodo."
  );

  drawSection(cursor, "Devoluciones recientes", "Reembolsos que reducen la venta neta del periodo.");
  drawTable(
    cursor,
    [
      { header: "Fecha", value: (saleReturn: OperationsReport["returns"]["latest"][number]) => formatDate(saleReturn.createdAt), width: 96 },
      { header: "Vendedor", value: (saleReturn) => saleReturn.cashier.name, width: 112 },
      { header: "Método", value: (saleReturn) => paymentMethodLabel(saleReturn.refundMethod), width: 78 },
      { align: "right", header: "Total", value: (saleReturn) => formatMoney(saleReturn.refundTotal), width: 74 },
      { header: "Motivo", value: (saleReturn) => saleReturn.reason, width: cursor.width - 96 - 112 - 78 - 74 }
    ],
    report.returns.latest.slice(0, 20),
    "Sin devoluciones en el periodo."
  );

  drawSection(cursor, "Movimientos recientes de inventario", "Últimos ajustes de entrada y salida registrados dentro del periodo.");
  drawTable(
    cursor,
    [
      { header: "Fecha", value: (movement: OperationsReport["inventory"]["movements"]["latest"][number]) => formatDate(movement.createdAt), width: 92 },
      { header: "Tipo", value: (movement) => inventoryMovementTypeLabel(movement.type), width: 54 },
      { header: "Motivo", value: (movement) => movement.reason ?? inventoryReasonTypeLabel(movement.reasonType), width: 92 },
      { header: "Producto", value: (movement) => movement.product.name, width: 136 },
      { header: "Almacén", value: (movement) => movement.warehouse?.name ?? "Sin almacén", width: 86 },
      { align: "right", header: "Uds.", value: (movement) => movement.quantity, width: cursor.width - 92 - 54 - 92 - 136 - 86 }
    ],
    report.inventory.movements.latest,
    "Sin movimientos de inventario en el periodo."
  );

}

function contentDisposition(filename: string) {
  return `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function streamOperationsPdf(req: Request, res: Response) {
  const range = parseReportDateRange(req.query.from, req.query.to);
  const report = await getOperationsReport(range);
  const filename = `reporte-operativo-${report.fromLabel}-${report.toLabel}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", contentDisposition(filename));

  const doc = new PDFDocument({
    margin: MARGIN,
    size: "A4",
    info: {
      Author: "Punta Venta",
      Subject: `Reporte operativo ${report.fromLabel} al ${report.toLabel}`,
      Title: "Reporte operativo Punta Venta"
    }
  });

  doc.pipe(res);
  writeOperationsPdf(doc, report);
  doc.end();
}
