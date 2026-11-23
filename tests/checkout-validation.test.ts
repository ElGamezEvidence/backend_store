import { describe, expect, it } from "vitest";
import { checkoutSchema } from "../src/validations/checkout";

describe("checkoutSchema", () => {
  const valid = {
    fullName: "Fatima Zahra",
    phone: "0612345678",
    phoneSecondary: "",
    region: "Casablanca-Settat",
    city: "Casablanca",
    addressLine: "Hay Mohammadi rue 12",
    postalCode: "",
    notes: "",
    shippingType: "HOME" as const,
    items: [{ productId: "clxxxxxxxxxxxxxxxxxxxxxxxxx", quantity: 1 }],
    idempotencyKey: "idempotency-key-123456",
    couponCode: "",
  };

  it("accepts a valid COD payload", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid Moroccan phone", () => {
    const result = checkoutSchema.safeParse({ ...valid, phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty cart", () => {
    const result = checkoutSchema.safeParse({ ...valid, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects short address", () => {
    const result = checkoutSchema.safeParse({ ...valid, addressLine: "ab" });
    expect(result.success).toBe(false);
  });
});
