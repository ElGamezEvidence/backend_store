import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { OrderListFilters } from "../types";

const orderInclude = {
  items: true,
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
    include: { changedBy: { select: { id: true, name: true, email: true } } },
  },
  customer: true,
  shippingMethod: true,
} satisfies Prisma.OrderInclude;

export class OrdersRepository {
  findByNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });
  }

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  findByIdempotencyKey(key: string) {
    return prisma.order.findUnique({
      where: { idempotencyKey: key },
      include: orderInclude,
    });
  }

  async list(filters: OrderListFilters = {}) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.pendingTajir) {
      where.status = { in: ["NEW", "CONFIRMED"] satisfies OrderStatus[] };
      where.sentToTajirAt = null;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.phone) {
      where.OR = [
        { customerPhone: { contains: filters.phone } },
        { customerPhone2: { contains: filters.phone } },
      ];
    }

    if (filters.query) {
      where.OR = [
        { orderNumber: { contains: filters.query, mode: "insensitive" } },
        { customerName: { contains: filters.query, mode: "insensitive" } },
        { customerPhone: { contains: filters.query } },
        { tajirReference: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    if (filters.sku) {
      where.items = { some: { sku: { contains: filters.sku, mode: "insensitive" } } };
    }

    if (filters.productId) {
      where.items = { some: { productId: filters.productId } };
    }

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}

export const ordersRepository = new OrdersRepository();
