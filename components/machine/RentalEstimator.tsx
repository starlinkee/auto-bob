"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Machine } from "@/lib/machine-schema";
import { estimate, formatMoney, rentalTotal, withVat } from "@/lib/pricing";

const MAX_DAYS = 365;

function parseDays(value: string): number | null {
  if (value.trim() === "") return null;
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= MAX_DAYS ? days : null;
}

export function RentalEstimator({ machine }: { machine: Machine }) {
  const { pricing, slug } = machine;
  const [value, setValue] = useState("1");
  const days = parseDays(value);
  const result = days === null ? null : estimate(pricing, { days });
  const net = days === null ? null : rentalTotal(pricing, days);
  const quoteHref =
    days === null ? `/contact?machine=${slug}` : `/contact?machine=${slug}&days=${days}`;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-muted p-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="rental-days" className="font-semibold text-ink">
          Rental days
        </label>
        <input
          id="rental-days"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_DAYS}
          step={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={days === null}
          aria-describedby={days === null ? "rental-days-error" : "rental-estimate"}
          className="w-32 rounded-md border border-border bg-surface px-3 py-2 text-ink"
        />
      </div>
      {result === null || net === null ? (
        <p id="rental-days-error" role="alert" className="font-semibold text-ink">
          Enter a whole number of days between 1 and {MAX_DAYS}.
        </p>
      ) : (
        <p id="rental-estimate" aria-live="polite" className="text-ink">
          <span className="block text-2xl font-bold">
            {formatMoney(net, pricing.currency)} net /{" "}
            {formatMoney(withVat(net, pricing.vatRate), pricing.currency)} gross
          </span>
          <span className="block text-sm text-body">
            {result.days} {result.days === 1 ? "day" : "days"} at{" "}
            {formatMoney(result.perDay, pricing.currency)} net per day
          </span>
        </p>
      )}
      <Button id="machine-quote" href={quoteHref}>
        Request a quote for this machine
      </Button>
    </div>
  );
}
