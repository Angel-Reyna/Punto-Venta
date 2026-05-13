import { Router } from "express";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    if (req.user?.role === Role.ADMIN) {
      const [
        products,
        lowStock,
        todaySales,
        users
      ] = await Promise.all([
        prisma.product.count({
          where: {
            isActive: true
          }
        }),

        prisma.product.count({
          where: {
            isActive: true,
            stock: {
              lte: 5
            }
          }
        }),

        prisma.sale.findMany({
          where: {
            createdAt: {
              gte: todayStart
            }
          }
        }),

        prisma.user.count({
          where: {
            isActive: true
          }
        })
      ]);

      return res.json({
        role: "ADMIN",
        products,
        lowStock,
        users,
        todaySalesCount: todaySales.length,
        todaySalesTotal: todaySales.reduce(
          (sum, sale) =>
            sum + Number(sale.total),
          0
        )
      });
    }

    const mySales = await prisma.sale.findMany({
      where: {
        cashierId: req.user!.id,
        createdAt: {
          gte: todayStart
        }
      }
    });

    return res.json({
      role: "CASHIER",
      products: 0,
      lowStock: 0,
      users: 0,
      todaySalesCount: mySales.length,
      todaySalesTotal: mySales.reduce(
        (sum, sale) =>
          sum + Number(sale.total),
        0
      )
    });
  })
);