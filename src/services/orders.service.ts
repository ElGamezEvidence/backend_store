import { OrderStatus, Prisma, ShippingType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { decimalFrom, roundMoney, toNumber } from "../lib/money";
import { ordersRepository } from "../repositories/orders.repository";
import { shippingService } from "./shipping.service";
import { tajirManualService } from "./tajir-manual.service";
import type { CheckoutPayload, OrderListFilters } from "../types";
import { checkoutSchema } from "../validations/checkout";

function generateOrderNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear().toString().slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `GZ-${stamp}-${random}`;
}

export class OrdersService {
  list(filters?: OrderListFilters) {
    return ordersRepository.list(filters);
  }

  getByNumber(orderNumber: string) {
    return ordersRepository.findByNumber(orderNumber);
  }

  getById(id: string) {
    return ordersRepository.findById(id);
  }

  getTajirCopyText(orderId: string) {
    return ordersRepository.findById(orderId).then((order) => {
      if (!order) throw new Error("ORDER_NOT_FOUND");
      return tajirManualService.buildCopyText(order);
    });
  }

  async createFromCheckout(raw: CheckoutPayload) {
    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`VALIDATION:${parsed.error.issues[0]?.message ?? "invalid"}`);
    }

    const data = parsed.data;

    const existing = await ordersRepository.findByIdempotencyKey(data.idempotencyKey);
    if (existing) return existing;

    const resolvedItems: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      productImage: string | null;
    }> = [];

    for (const item of data.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, deletedAt: null, status: "ACTIVE" },
        include: {
          variants: true,
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        },
      });

      if (!product) throw new Error("PRODUCT_UNAVAILABLE");

      let unitPrice = toNumber(product.price);
      let sku = product.sku;
      let variantName: string | null = null;
      let variantId: string | null = null;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isAvailable) throw new Error("VARIANT_INVALID");
        variantId = variant.id;
        variantName = variant.name;
        sku = variant.sku;
        if (variant.price != null) unitPrice = toNumber(variant.price);
      } else if (product.variants.length > 0) {
        throw new Error("VARIANT_REQUIRED");
      }

      if (!sku?.trim()) throw new Error("SKU_MISSING");

      const lineTotal = roundMoney(unitPrice * item.quantity);
      resolvedItems.push({
        productId: product.id,
        variantId,
        productName: product.name,
        variantName,
        sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        productImage: product.images[0]?.url ?? null,
      });
    }

    const subtotal = roundMoney(resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0));
    const region = data.region?.trim() || "Maroc";
    const shipping = await shippingService.calculateFee(
      region,
      data.city,
      data.shippingType as ShippingType,
    );
    const total = roundMoney(subtotal + shipping.fee);

    const methods = await shippingService.listMethods();
    const method = methods.find((m) => m.type === data.shippingType);

    return prisma.$transaction(async (tx) => {
      const again = await tx.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { items: true, statusHistory: true, customer: true, shippingMethod: true },
      });
      if (again) return again;

      const customer =
        (await tx.customer.findFirst({ where: { phone: data.phone } })) ??
        (await tx.customer.create({
          data: {
            fullName: data.fullName,
            phone: data.phone,
            phoneSecondary: data.phoneSecondary || null,
          },
        }));

      await tx.customer.update({
        where: { id: customer.id },
        data: {
          fullName: data.fullName,
          phoneSecondary: data.phoneSecondary || customer.phoneSecondary,
        },
      });

      await tx.address.create({
        data: {
          customerId: customer.id,
          region,
          city: data.city,
          addressLine: data.addressLine,
          postalCode: data.postalCode || null,
          isDefault: true,
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          shippingMethodId: method?.id,
          status: "NEW",
          shippingType: data.shippingType as ShippingType,
          customerName: data.fullName,
          customerPhone: data.phone,
          customerPhone2: data.phoneSecondary || null,
          region,
          city: data.city,
          addressLine: data.addressLine,
          postalCode: data.postalCode || null,
          notes: data.notes || null,
          subtotal: decimalFrom(subtotal),
          shippingFee: decimalFrom(shipping.fee),
          discount: decimalFrom(0),
          total: decimalFrom(total),
          currency: "MAD",
          paymentMethod: "COD",
          idempotencyKey: data.idempotencyKey,
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: decimalFrom(item.unitPrice),
              lineTotal: decimalFrom(item.lineTotal),
              productImage: item.productImage,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "NEW",
              comment: "Commande créée depuis le store",
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
          customer: true,
          shippingMethod: true,
        },
      });

      return order;
    });
  }

  async updateStatus(params: {
    orderId: string;
    toStatus: OrderStatus;
    userId?: string;
    comment?: string;
  }) {
    const order = await ordersRepository.findById(params.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (params.toStatus === "SENT_TO_TAJIR") {
      const gate = tajirManualService.canMarkAsSent(order);
      if (!gate.ok) throw new Error(gate.reason ?? "CANNOT_MARK_SENT");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: params.orderId },
        data: {
          status: params.toStatus,
          ...(params.toStatus === "SENT_TO_TAJIR"
            ? { sentToTajirAt: new Date() }
            : {}),
        },
        include: {
          items: true,
          statusHistory: true,
          customer: true,
          shippingMethod: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: params.orderId,
          fromStatus: order.status,
          toStatus: params.toStatus,
          changedById: params.userId,
          comment: params.comment,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: "ORDER_STATUS_CHANGE",
          entityType: "Order",
          entityId: params.orderId,
          metadata: {
            from: order.status,
            to: params.toStatus,
            comment: params.comment ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async setTajirReference(orderId: string, reference: string, userId?: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { tajirReference: reference.trim() || null },
      include: {
        items: true,
        statusHistory: true,
        customer: true,
        shippingMethod: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "ORDER_TAJIR_REFERENCE",
        entityType: "Order",
        entityId: orderId,
        metadata: { tajirReference: reference },
      },
    });

    return updated;
  }
}

export const ordersService = new OrdersService();
