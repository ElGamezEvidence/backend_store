import type { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ProductListFilters } from "../types";

const productInclude = {
  images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }] },
  variants: { orderBy: { sortOrder: "asc" as const } },
  categories: { include: { category: true } },
  reviews: { where: { status: "APPROVED" as const }, take: 20, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.ProductInclude;

export class ProductsRepository {
  findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: productInclude,
    });
  }

  findById(id: string) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
  }

  async list(filters: ProductListFilters = {}) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: "insensitive" } },
        { sku: { contains: filters.query, mode: "insensitive" } },
        { shortDescription: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    if (filters.categorySlug) {
      where.categories = {
        some: { category: { slug: filters.categorySlug, isActive: true } },
      };
    }

    if (filters.featured) where.isFeatured = true;
    if (filters.popular) where.isPopular = true;
    if (filters.onSale) where.isOnSale = true;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters.sort === "price_asc"
        ? { price: "asc" }
        : filters.sort === "price_desc"
          ? { price: "desc" }
          : filters.sort === "popular"
            ? { isPopular: "desc" }
            : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: productInclude });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data, include: productInclude });
  }

  softDelete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" satisfies ProductStatus },
    });
  }
}

export const productsRepository = new ProductsRepository();
