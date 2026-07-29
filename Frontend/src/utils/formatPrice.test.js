import { describe, expect, it } from "vitest";
import { formatPrice } from "./formatPrice";

describe("formatPrice", () => {
  it("formats INR amounts for the commerce UI", () => {
    expect(formatPrice(1250)).toContain("1,250");
    expect(formatPrice(0)).toContain("0");
  });

  it("returns a safe placeholder for invalid values", () => {
    expect(formatPrice(undefined)).toBe("-");
    expect(formatPrice("not-a-price")).toBe("-");
  });
});
