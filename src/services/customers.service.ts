import { prisma } from "../lib/prisma";
import { toNumber } from "../lib/money";

export class CustomersService {
  async list(page = 1, pageSize = 20, query?: string) {
    const where = query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            select: { id: true, total: true, createdAt: true, orderNumber: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items: customers.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        phoneSecondary: c.phoneSecondary,
        ordersCount: c.orders.length,
        totalSpent: c.orders.reduce((sum, o) => sum + toNumber(o.total), 0),
        lastOrder: c.orders[0] ?? null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const customersService = new CustomersService();
