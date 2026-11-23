import { prisma } from "../lib/prisma";

export class ShippingRepository {
  listZones(activeOnly = true) {
    return prisma.shippingZone.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ region: "asc" }, { city: "asc" }],
    });
  }

  findZone(region: string, city: string) {
    return prisma.shippingZone.findFirst({
      where: {
        isActive: true,
        region: { equals: region, mode: "insensitive" },
        city: { equals: city, mode: "insensitive" },
      },
    });
  }

  listMethods(activeOnly = true) {
    return prisma.shippingMethod.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const shippingRepository = new ShippingRepository();
