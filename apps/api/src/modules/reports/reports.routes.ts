import { Router } from "express";
import PDFDocument from "pdfkit";
import { Role, SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requireRole
} from "../../middlewares/auth";

import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";

export const reportsRouter = Router();

reportsRouter.use(
  requireAuth,
  requireRole(Role.ADMIN)
);


function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDateRange(
  from?: unknown,
  to?: unknown
) {
  if (!from || !to) {
    throw new AppError(
      400,
      "Debes enviar fecha inicial y fecha final"
    );
  }

  const start = new Date(String(from));
  const end = new Date(String(to));

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new AppError(
      400,
      "Rango de fechas inválido"
    );
  }

  if (start > end) {
    throw new AppError(
      400,
      "La fecha inicial no puede ser mayor que la fecha final"
    );
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end
  };
}

reportsRouter.get(
  "/sales",
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(
      req.query.from,
      req.query.to
    );

    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",

        createdAt: {
          gte: start,
          lte: end
        }
      },

      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },

        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },

        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true
              }
            }
          }
        },

        payments: true
      },

      orderBy: {
        createdAt: "desc"
      }
    });

    const subtotal = sales.reduce(
      (sum, sale) => sum + Number(sale.subtotal),
      0
    );

    const discount = sales.reduce(
      (sum, sale) => sum + Number(sale.discount),
      0
    );

    const tax = sales.reduce(
      (sum, sale) => sum + Number(sale.tax),
      0
    );

    const total = sales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0
    );

    const paymentSummary = sales
      .flatMap((sale) => sale.payments)
      .reduce<Record<string, number>>(
        (summary, payment) => {
          const method = payment.method;

          summary[method] =
            (summary[method] ?? 0) +
            Number(payment.amount);

          return summary;
        },
        {}
      );

    res.json({
      from: start,
      to: end,

      count: sales.length,

      subtotal,
      discount,
      tax,
      total,

      paymentSummary,

      sales: sales.map((sale) => ({
        ...sale,

        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        tax: Number(sale.tax),
        total: Number(sale.total),

        items: sale.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          total: Number(item.total)
        })),

        payments: sale.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount)
        }))
      }))
    });
  })
);


reportsRouter.get(
  "/operations",
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(
      req.query.from,
      req.query.to
    );

    const [sales, returns, cashSessions, cashMovements, topProducts] =
      await Promise.all([
        prisma.sale.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            payments: true
          }
        }),
        prisma.saleReturn.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            cashier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }),
        prisma.cashRegisterSession.findMany({
          where: {
            openedAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            cashier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            openedAt: "desc"
          }
        }),
        prisma.cashMovement.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            cashier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }),
        prisma.saleItem.groupBy({
          by: ["productId"],
          where: {
            sale: {
              status: {
                in: [
                  SaleStatus.COMPLETED,
                  SaleStatus.PARTIALLY_REFUNDED,
                  SaleStatus.REFUNDED
                ]
              },
              createdAt: {
                gte: start,
                lte: end
              }
            }
          },
          _sum: {
            quantity: true,
            total: true
          },
          orderBy: {
            _sum: {
              quantity: "desc"
            }
          },
          take: 10
        })
      ]);

    const productIds = topProducts.map((item) => item.productId);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: {
            id: {
              in: productIds
            }
          },
          select: {
            id: true,
            sku: true,
            name: true
          }
        })
      : [];
    const productById = new Map(products.map((product) => [product.id, product]));

    const salesByStatus = sales.reduce<Record<string, number>>(
      (summary, sale) => {
        summary[sale.status] = (summary[sale.status] ?? 0) + 1;

        return summary;
      },
      {}
    );

    const grossSales = roundMoney(
      sales
        .filter((sale) => sale.status !== "CANCELLED")
        .reduce((sum, sale) => sum + Number(sale.total), 0)
    );
    const refundedTotal = roundMoney(
      returns.reduce((sum, saleReturn) => sum + Number(saleReturn.refundTotal), 0)
    );
    const netSales = roundMoney(grossSales - refundedTotal);

    const paymentSummary = sales
      .filter((sale) => sale.status !== "CANCELLED")
      .flatMap((sale) => sale.payments)
      .reduce<Record<string, number>>((summary, payment) => {
        summary[payment.method] = roundMoney(
          (summary[payment.method] ?? 0) + Number(payment.amount)
        );

        return summary;
      }, {});

    const cashMovementSummary = cashMovements.reduce<Record<string, number>>(
      (summary, movement) => {
        summary[movement.type] = roundMoney(
          (summary[movement.type] ?? 0) + Number(movement.amount)
        );

        return summary;
      },
      {}
    );

    res.json({
      from: start,
      to: end,
      sales: {
        count: sales.length,
        byStatus: salesByStatus,
        gross: grossSales,
        refunded: refundedTotal,
        net: netSales,
        paymentSummary
      },
      returns: {
        count: returns.length,
        total: refundedTotal,
        latest: returns.slice(0, 20).map((saleReturn) => ({
          ...saleReturn,
          refundTotal: Number(saleReturn.refundTotal)
        }))
      },
      cashRegister: {
        sessions: cashSessions.map((session) => ({
          ...session,
          openingAmount: Number(session.openingAmount),
          expectedClosingAmount:
            session.expectedClosingAmount === null
              ? null
              : Number(session.expectedClosingAmount),
          closingAmount:
            session.closingAmount === null ? null : Number(session.closingAmount),
          difference: session.difference === null ? null : Number(session.difference)
        })),
        movements: {
          count: cashMovements.length,
          summary: cashMovementSummary
        }
      },
      topProducts: topProducts.map((item) => ({
        product: productById.get(item.productId) ?? {
          id: item.productId,
          sku: null,
          name: "Producto no encontrado"
        },
        quantity: item._sum.quantity ?? 0,
        total: Number(item._sum.total ?? 0)
      }))
    });
  })
);

reportsRouter.get(
  "/sales/pdf",
  asyncHandler(async (req, res) => {
    const { start, end } = parseDateRange(
      req.query.from,
      req.query.to
    );

    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",

        createdAt: {
          gte: start,
          lte: end
        }
      },

      include: {
        cashier: {
          select: {
            name: true,
            email: true
          }
        },

        customer: {
          select: {
            name: true
          }
        },

        payments: true
      },

      orderBy: {
        createdAt: "desc"
      }
    });

    const subtotal = sales.reduce(
      (sum, sale) => sum + Number(sale.subtotal),
      0
    );

    const discount = sales.reduce(
      (sum, sale) => sum + Number(sale.discount),
      0
    );

    const tax = sales.reduce(
      (sum, sale) => sum + Number(sale.tax),
      0
    );

    const total = sales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0
    );

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte-ventas.pdf"'
    );

    const doc = new PDFDocument({
      margin: 40
    });

    doc.pipe(res);

    doc
      .fontSize(20)
      .text("Reporte de ventas", {
        align: "center"
      });

    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Desde: ${start.toLocaleDateString()}`);

    doc.text(`Hasta: ${end.toLocaleDateString()}`);

    doc.moveDown();

    doc.text(`Ventas completadas: ${sales.length}`);
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`);
    doc.text(`Descuentos: $${discount.toFixed(2)}`);
    doc.text(`Impuestos: $${tax.toFixed(2)}`);

    doc
      .fontSize(14)
      .text(`Total: $${total.toFixed(2)}`);

    doc.moveDown();

    doc
      .fontSize(12)
      .text("Detalle de ventas");

    doc.moveDown(0.5);

    sales.forEach((sale) => {
      const payments = sale.payments
        .map(
          (payment) =>
            `${payment.method}: $${Number(payment.amount).toFixed(2)}`
        )
        .join(", ");

      doc
        .fontSize(9)
        .text(`Folio: ${sale.folio}`);

      doc.text(`Fecha: ${sale.createdAt.toLocaleString()}`);

      doc.text(
        `Cajero: ${sale.cashier.name} (${sale.cashier.email})`
      );

      doc.text(
        `Cliente: ${sale.customer?.name ?? "Sin cliente"}`
      );

      doc.text(`Pago: ${payments || "N/A"}`);

      doc.text(`Total: $${Number(sale.total).toFixed(2)}`);

      doc.moveDown(0.75);
    });

    doc.end();
  })
);