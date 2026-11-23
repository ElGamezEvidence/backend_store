import type { Prisma } from "@prisma/client";
import { slugifyText } from "../lib/utils";
import { productsRepository } from "../repositories/products.repository";
import type { ProductListFilters } from "../types";
import { productSchema, type ProductFormValues } from "../validations/product";
import { prisma } from "../lib/prisma";
import { decimalFrom } from "../lib/money";

export class ProductsService {
  list(filters?: ProductListFilters) {
    return productsRepository.list(filters);
  }

  getBySlug(slug: string) {
    return productsRepository.findBySlug(slug);
  }

  getById(id: string) {
    return productsRepository.findById(id);
  }

  listActiveStore(filters?: ProductListFilters) {
    return productsRepository.list({
      ...filters,
      status: "ACTIVE",
    });
  }

  async create(raw: ProductFormValues) {
    const data = productSchema.parse(raw);
    const slug = data.slug?.trim() || slugifyText(data.name);

    return prisma.product.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        slug,
        shortDescription: data.shortDescription,
        description: data.description,
        descriptionAr: data.descriptionAr,
        descriptionEn: data.descriptionEn,
        features: data.features,
        price: decimalFrom(data.price),
        compareAtPrice: data.compareAtPrice != null ? decimalFrom(data.compareAtPrice) : null,
        costPrice: data.costPrice != null ? decimalFrom(data.costPrice) : null,
        sku: data.sku,
        status: data.status,
        stockQuantity: data.stockQuantity,
        isFeatured: data.isFeatured,
        isPopular: data.isPopular,
        isOnSale: data.isOnSale,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        images: {
          create: data.images.map((img, index) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder ?? index,
            isPrimary: img.isPrimary || index === 0,
          })),
        },
        variants: {
          create: data.variants.map((v, index) => ({
            name: v.name,
            sku: v.sku,
            price: v.price != null ? decimalFrom(v.price) : null,
            compareAtPrice: v.compareAtPrice != null ? decimalFrom(v.compareAtPrice) : null,
            stockQuantity: v.stockQuantity,
            isAvailable: v.isAvailable,
            attributes: (v.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
            imageUrl: v.imageUrl || null,
            sortOrder: v.sortOrder ?? index,
          })),
        },
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: {
        images: true,
        variants: true,
        categories: { include: { category: true } },
      },
    });
  }

  async update(id: string, raw: ProductFormValues) {
    const data = productSchema.parse(raw);
    const slug = data.slug?.trim() || slugifyText(data.name);

    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productCategory.deleteMany({ where: { productId: id } });

      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          slug,
          shortDescription: data.shortDescription,
          description: data.description,
          descriptionAr: data.descriptionAr,
          descriptionEn: data.descriptionEn,
          features: data.features,
          price: decimalFrom(data.price),
          compareAtPrice: data.compareAtPrice != null ? decimalFrom(data.compareAtPrice) : null,
          costPrice: data.costPrice != null ? decimalFrom(data.costPrice) : null,
          sku: data.sku,
          status: data.status,
          stockQuantity: data.stockQuantity,
          isFeatured: data.isFeatured,
          isPopular: data.isPopular,
          isOnSale: data.isOnSale,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          images: {
            create: data.images.map((img, index) => ({
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder ?? index,
              isPrimary: img.isPrimary || index === 0,
            })),
          },
          variants: {
            create: data.variants.map((v, index) => ({
              name: v.name,
              sku: v.sku,
              price: v.price != null ? decimalFrom(v.price) : null,
              compareAtPrice: v.compareAtPrice != null ? decimalFrom(v.compareAtPrice) : null,
              stockQuantity: v.stockQuantity,
              isAvailable: v.isAvailable,
              attributes: (v.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
              imageUrl: v.imageUrl || null,
              sortOrder: v.sortOrder ?? index,
            })),
          },
          categories: {
            create: data.categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
      });
    });

    return productsRepository.findById(id);
  }

  archive(id: string) {
    return productsRepository.softDelete(id);
  }
}

export const productsService = new ProductsService();
