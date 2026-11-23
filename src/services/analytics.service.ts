import { prisma } from "../lib/prisma";
import { toNumber } from "../lib/money";
import type { DashboardRange } from "../types";

function rangeToDates(range: DashboardRange, from?: Date, to?: Date) {
  const now = new Date();
  const end = to ?? now;
  const start = new Date(end);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (from) return { start: from, end };
      start.setDate(start.getDate() - 30);
      break;
  }

  return { start, end };
}

export class AnalyticsService {
  async getDashboard(range: DashboardRange = "30d", from?: Date, to?: Date) {
    const { start, end } = rangeToDates(range, from, to);

    const [
      totalOrders,
      newOrders,
      pendingTajir,
      sentToTajir,
      delivered,
      cancelled,
      revenueAgg,
      activeProducts,
      ordersInRange,
      topProducts,
      statusGroups,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.order.count({
        where: { status: { in: ["NEW", "CONFIRMED"] }, sentToTajirAt: null },
      }),
      prisma.order.count({ where: { status: "SENT_TO_TAJIR" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ["CANCELLED", "FAILED"] },
        },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, total: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderItem.groupBy({
        by: ["productName", "sku"],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 8,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const ordersByDayMap = new Map<string, { orders: number; sales: number }>();
    for (const order of ordersInRange) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const current = ordersByDayMap.get(key) ?? { orders: 0, sales: 0 };
      current.orders += 1;
      current.sales += toNumber(order.total);
      ordersByDayMap.set(key, current);
    }

    return {
      kpis: {
        totalOrders,
        newOrders,
        pendingTajir,
        sentToTajir,
        delivered,
        cancelled,
        revenue: toNumber(revenueAgg._sum.total),
        activeProducts,
      },
      ordersByDay: Array.from(ordersByDayMap.entries()).map(([date, value]) => ({
        date,
        ...value,
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        sku: p.sku,
        quantity: p._sum.quantity ?? 0,
        sales: toNumber(p._sum.lineTotal),
      })),
      statusDistribution: statusGroups.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      range: { start, end },
    };
  }
}

export const analyticsService = new AnalyticsService();
