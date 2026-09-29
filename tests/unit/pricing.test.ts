import { describe, expect, it } from "vitest";
import type { Pricing } from "@/lib/machine-schema";
import { estimate, formatMoney, fromPrice, rentalTotal, tierFor, withVat } from "@/lib/pricing";

const pricing: Pricing = {
  currency: "PLN",
  vatRate: 0.23,
  deposit: 5000,
  tiers: [
    { fromDays: 1, toDays: 1, perDay: 900 },
    { fromDays: 2, toDays: 3, perDay: 820 },
    { fromDays: 4, toDays: 7, perDay: 740 },
    { fromDays: 8, toDays: 30, perDay: 660 },
    { fromDays: 31, toDays: null, perDay: 580 },
  ],
  extras: { operatorPerDay: 450, deliveryPerKm: 6, extraHour: 120 },
};

describe("rentalTotal", () => {
  it.each([
    [1, 900],
    [2, 1640],
    [3, 2460],
    [4, 2960],
    [7, 5180],
    [8, 5280],
    [30, 19800],
    [31, 17980],
    [90, 52200],
  ])("%i days costs %i", (days, total) => {
    expect(rentalTotal(pricing, days)).toBe(total);
  });

  it("picks the tier covering the day count", () => {
    expect(tierFor(pricing, 5).perDay).toBe(740);
  });
});

describe("estimate", () => {
  it("adds operator, delivery and VAT", () => {
    expect(estimate(pricing, { days: 5, operator: true, deliveryKm: 20 })).toEqual({
      days: 5,
      perDay: 740,
      rental: 3700,
      operator: 2250,
      delivery: 120,
      net: 6070,
      vat: 1396.1,
      gross: 7466.1,
    });
  });

  it("defaults to rental only", () => {
    const result = estimate(pricing, { days: 1 });
    expect(result).toMatchObject({ operator: 0, delivery: 0, net: 900, vat: 207, gross: 1107 });
  });
});

describe("helpers", () => {
  it("fromPrice is the lowest daily price", () => expect(fromPrice(pricing)).toBe(580));
  it("withVat adds VAT", () => expect(withVat(900, 0.23)).toBe(1107));
  it("formatMoney formats without decimals", () => {
    expect(formatMoney(900, "PLN").replace(/\s/g, " ")).toBe("PLN 900");
  });
});

describe("validation", () => {
  it.each([0, 1.5, -1])("throws RangeError for %s days", (days) => {
    expect(() => rentalTotal(pricing, days)).toThrow(RangeError);
    expect(() => estimate(pricing, { days })).toThrow(RangeError);
  });

  it("throws RangeError for negative delivery distance", () => {
    expect(() => estimate(pricing, { days: 1, deliveryKm: -1 })).toThrow(RangeError);
  });

  it("throws RangeError for an operator when none is offered", () => {
    const noOperator = { ...pricing, extras: { ...pricing.extras, operatorPerDay: null } };
    expect(() => estimate(noOperator, { days: 2, operator: true })).toThrow(RangeError);
  });
});
