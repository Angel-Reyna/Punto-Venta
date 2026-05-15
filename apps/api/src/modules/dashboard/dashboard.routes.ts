import { Router } from "express";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

async function getCurrentStock(productId: string) {
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      productId
    },
    select: {
      type: true,
      quantity: true
    }
  });

  return movements.reduce((stock, movement) => {
    if (
      movement.type === "IN" ||
      movement.type === "RETURN"
    ) {
      return stock + movement.quantity;
    }

    if (
      movement.type === "OUT" ||
      movement.type === "SALE"
    ) {
      return stock - movement.quantity;
    }

    return stock;
  }, 0);
}

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

      const stockResults = await Promise.all(
        products.map(async (product) => {
          const stock = await getCurrentStock(product.id);

          return {
            stock,
            minStock: product.minStock
          };
        })
      );

      const lowStock = stockResults.filter(
        (item) => item.stock <= item.minStock
      ).length;

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