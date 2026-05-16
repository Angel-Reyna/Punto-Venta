import { Router } from "express";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

import { getProductStocks } from "../inventory/inventory.service";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (req.user?.role === Role.ADMIN) {
      const [
        activeProducts,
        activeUsers,
        todaySales,
        products
      ] = await Promise.all([
        prisma.product.count({
          where: {
            isActive: true
          }
        }),

        prisma.user.count({
          where: {
            isActive: true
          }
        }),

        prisma.sale.findMany({
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: todayStart
            }
          },
          select: {
            id: true,
            total: true
          }
        }),

        prisma.product.findMany({
          where: {
            isActive: true
          },
          select: {
            id: true,
            minStock: true
          }
        })
      ]);

      const stocks = await getProductStocks(
        products.map((product) => product.id)
      );

      const lowStock = products.filter((product) => {
        const stock = stocks.get(product.id) ?? 0;

        return stock <= product.minStock;
      }).length;

      return res.json({
        role: "ADMIN",

        products: activeProducts,

        lowStock,

        users: activeUsers,

        todaySalesCount: todaySales.length,

        todaySalesTotal: todaySales.reduce(
          (sum, sale) => sum + Number(sale.total),
          0
        )
      });
    }

    const mySales = await prisma.sale.findMany({
      where: {
        cashierId: req.user!.id,
        status: "COMPLETED",
        createdAt: {
          gte: todayStart
        }
      },
      select: {
        id: true,
        total: true
      }
    });

    return res.json({
      role: "CASHIER",

      products: 0,

      lowStock: 0,

      users: 0,

      todaySalesCount: mySales.length,

      todaySalesTotal: mySales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
      )
    });
  })
);
