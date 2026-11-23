import { describe, expect, it } from "vitest";
import { tajirManualService } from "../src/services/tajir-manual.service";
import type { Order, OrderItem } from "@prisma/client";

function baseOrder(overrides: Partial<Order> = {}): Order & { items: OrderItem[] } {
  return {
    id: "ord_1",
    orderNumber: "GZ-260323-123456",
    customerId: "cus_1",
    shippingMethodId: null,
    status: "NEW",
    shippingType: "HOME",
    customerName: "Fatima Zahra",
    customerPhone: "0612345678",
    customerPhone2: "0699887766",
    region: "Casablanca-Settat",
    city: "Casablanca",
    addressLine: "Hay Mohammadi, rue 12",
    postalCode: null,
    notes: "Appeler avant",
    subtotal: 149 as never,
    shippingFee: 20 as never,
    discount: 0 as never,
    total: 169 as never,
    currency: "MAD",
    couponCode: null,
    tajirReference: null,
    sentToTajirAt: null,
    paymentMethod: "COD",
    idempotencyKey: "abc",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
    items: [
      {
        id: "item_1",
        orderId: "ord_1",
        productId: "prod_1",
        variantId: "var_1",
        productName: "Collagen Hair",
        variantName: "Rose",
        sku: "SEED-TH-001-PINK",
        quantity: 1,
        unitPrice: 149 as never,
        lineTotal: 149 as never,
        productImage: null,
      },
    ],
  };
}

describe("TajirManualService", () => {
  it("builds a structured copy text with SKU", () => {
    const text = tajirManualService.buildCopyText(baseOrder());
    expect(text).toContain("Numéro de commande interne : GZ-260323-123456");
    expect(text).toContain("SKU : SEED-TH-001-PINK");
    expect(text).toContain("Variante : Rose");
    expect(text).toContain("Total : 169 MAD");
  });

  it("prevents double transmission", () => {
    const already = tajirManualService.canMarkAsSent(
      baseOrder({ status: "SENT_TO_TAJIR", sentToTajirAt: new Date() }),
    );
    expect(already.ok).toBe(false);
    expect(already.reason).toBe("ALREADY_SENT");
  });

  it("allows marking new orders as sent", () => {
    expect(tajirManualService.canMarkAsSent(baseOrder()).ok).toBe(true);
  });
});
