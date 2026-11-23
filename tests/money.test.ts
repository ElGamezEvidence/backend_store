import { describe, expect, it } from "vitest";
import { roundMoney } from "../src/lib/money";
import { discountPercent } from "../src/lib/utils";

describe("money helpers", () => {
  it("rounds to 2 decimals", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(19.999)).toBe(20);
  });

  it("computes discount percent", () => {
    expect(discountPercent(159, 199)).toBe(20);
    expect(discountPercent(100, 100)).toBeNull();
    expect(discountPercent(120, 100)).toBeNull();
  });
});
