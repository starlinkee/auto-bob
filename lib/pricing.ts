import type { Pricing } from "@/lib/machine-schema";

export type Estimate = {
  days: number;
  perDay: number;
  rental: number;
  operator: number;
  delivery: number;
  net: number;
  vat: number;
  gross: number;
};

export const TIER_COLUMNS = ["1 day", "2–3 days", "4–7 days", "8–30 days", "30+ days"] as const;

function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function assertDays(days: number): void {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`days must be an integer >= 1, got ${days}`);
  }
}

export function tierFor(pricing: Pricing, days: number): Pricing["tiers"][number] {
  assertDays(days);
  const tier = pricing.tiers.find(
    (t) => days >= t.fromDays && (t.toDays === null || days <= t.toDays),
  );
  if (!tier) throw new RangeError(`no price tier covers ${days} days`);
  return tier;
}

export function rentalTotal(pricing: Pricing, days: number): number {
  return days * tierFor(pricing, days).perDay;
}

export function estimate(
  pricing: Pricing,
  options: { days: number; operator?: boolean; deliveryKm?: number },
): Estimate {
  const { days, operator = false, deliveryKm = 0 } = options;
  assertDays(days);
  if (!Number.isFinite(deliveryKm) || deliveryKm < 0) {
    throw new RangeError(`deliveryKm must be >= 0, got ${deliveryKm}`);
  }
  const perDay = tierFor(pricing, days).perDay;
  const operatorRate = pricing.extras.operatorPerDay;
  if (operator && operatorRate === null) {
    throw new RangeError("this machine has no operator option");
  }
  const rental = days * perDay;
  const operatorCost = operator && operatorRate !== null ? days * operatorRate : 0;
  const delivery = round2(deliveryKm * pricing.extras.deliveryPerKm);
  const net = round2(rental + operatorCost + delivery);
  const vat = round2(net * pricing.vatRate);
  return {
    days,
    perDay,
    rental,
    operator: operatorCost,
    delivery,
    net,
    vat,
    gross: round2(net + vat),
  };
}

export function fromPrice(pricing: Pricing): number {
  return Math.min(...pricing.tiers.map((t) => t.perDay));
}

export function withVat(amount: number, vatRate: number): number {
  return round2(amount * (1 + vatRate));
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
