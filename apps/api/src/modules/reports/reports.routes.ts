import { Router } from "express";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requireRole
} from "../../middlewares/auth";

import { asyncHandler } from "../../utils/asyncHandler";

import { Role } from "@prisma/client";

import PDFDocument from "pdfkit";

export const reportsRouter = Router();

reportsRouter.use(
  requireAuth,
  requireRole(Role.ADMIN)
);

reportsRouter.get(
  "/sales",
  asyncHandler(async (req, res) => {
    const from = new Date(
      String(req.query.from)
    );

    const to = new Date(
      String(req.query.to)
    );

    to.setHours(23, 59, 59, 999);

    const sales =
      await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: from,
            lte: to
          }
        },

        include: {
          items: true
        }
      });

    const subtotal = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.subtotal),
      0
    );

    const discount = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.discount),
      0
    );

    const total = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total),
      0
    );

    res.json({
      count: sales.length,
      subtotal,
      discount,
      total
    });
  })
);

reportsRouter.get(
  "/sales/pdf",
  asyncHandler(async (req, res) => {
    const from = new Date(
      String(req.query.from)
    );

    const to = new Date(
      String(req.query.to)
    );

    to.setHours(23, 59, 59, 999);

    const sales =
      await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: from,
            lte: to
          }
        }
      });

    const subtotal = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.subtotal),
      0
    );

    const discount = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.discount),
      0
    );

    const total = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total),
      0
    );

    const doc = new PDFDocument({
      margin: 40
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte-ventas.pdf"'
    );

    doc.pipe(res);

    doc
      .fontSize(22)
      .text(
        "Reporte de Ventas",
        {
          align: "center"
        }
      );

    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        `Desde: ${from.toLocaleDateString()}`
      );

    doc.text(
      `Hasta: ${to.toLocaleDateString()}`
    );

    doc.moveDown();

    doc.text(
      `Cantidad de ventas: ${sales.length}`
    );

    doc.text(
      `Subtotal: $${subtotal.toFixed(
        2
      )}`
    );

    doc.text(
      `Descuentos: $${discount.toFixed(
        2
      )}`
    );

    doc
      .fontSize(16)
      .text(
        `Total: $${total.toFixed(2)}`
      );

    doc.end();
  })
);