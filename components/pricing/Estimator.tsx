"use client";

import { CATEGORIES } from "@/lib/fleet";
import type { Machine } from "@/lib/machines";
import { estimate, formatMoney } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-ink";

function parseIntegerInRange(raw: string, min: number, max: number): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

export function Estimator({
  machines,
  machine,
  onSelect,
}: {
  machines: Machine[];
  machine: Machine;
  onSelect: (slug: string) => void;
}) {
  const [days, setDays] = useState("7");
  const [operator, setOperator] = useState(false);
  const [km, setKm] = useState("0");

  const { currency, extras } = machine.pricing;
  const operatorAvailable = extras.operatorPerDay !== null;
  const daysValue = parseIntegerInRange(days, 1, 365);
  const kmValue = parseIntegerInRange(km, 0, 500);
  const result =
    daysValue !== null && kmValue !== null
      ? estimate(machine.pricing, {
          days: daysValue,
          operator: operator && operatorAvailable,
          deliveryKm: kmValue,
        })
      : null;
  const money = (amount: number) => formatMoney(amount, currency);

  const quoteHref = `/contact?machine=${encodeURIComponent(machine.slug)}${
    daysValue !== null ? `&days=${daysValue}` : ""
  }`;

  const rows: { id: string; label: string; value: (r: NonNullable<typeof result>) => number }[] = [
    { id: "est-per-day", label: "Price per day", value: (r) => r.perDay },
    { id: "est-rental", label: "Rental", value: (r) => r.rental },
    { id: "est-operator-cost", label: "Operator", value: (r) => r.operator },
    { id: "est-delivery-cost", label: "Delivery", value: (r) => r.delivery },
    { id: "est-net", label: "Total net", value: (r) => r.net },
    { id: "est-vat", label: "VAT", value: (r) => r.vat },
    { id: "est-gross", label: "Total gross", value: (r) => r.gross },
  ];

  return (
    <section id="estimator" aria-labelledby="estimator-title">
      <h2 id="estimator-title" className="mb-4 text-3xl text-ink">
        Rental estimator
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="est-machine" className="mb-1 block font-semibold text-ink">
              Machine
            </label>
            <select
              id="est-machine"
              value={machine.slug}
              onChange={(event) => {
                const next = machines.find((m) => m.slug === event.target.value);
                onSelect(event.target.value);
                if (next?.pricing.extras.operatorPerDay === null) setOperator(false);
              }}
              className={inputClass}
            >
              {CATEGORIES.map((category) => {
                const items = machines.filter((m) => m.category === category.id);
                if (items.length === 0) return null;
                return (
                  <optgroup key={category.id} label={category.plural}>
                    {items.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="est-days" className="mb-1 block font-semibold text-ink">
              Rental days (1–365)
            </label>
            <input
              id="est-days"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              step={1}
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex min-h-11 items-center gap-3 font-semibold text-ink">
              <input
                id="est-operator"
                type="checkbox"
                checked={operator && operatorAvailable}
                disabled={!operatorAvailable}
                onChange={(event) => setOperator(event.target.checked)}
                aria-describedby={operatorAvailable ? undefined : "est-operator-note"}
                className="size-5"
              />
              Include operator
            </label>
            {!operatorAvailable && (
              <p id="est-operator-note" className="text-sm">
                This machine is rented without an operator.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="est-delivery-km" className="mb-1 block font-semibold text-ink">
              Delivery distance, km (0–500)
            </label>
            <input
              id="est-delivery-km"
              type="number"
              inputMode="numeric"
              min={0}
              max={500}
              step={1}
              value={km}
              onChange={(event) => setKm(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div aria-live="polite" className="rounded-md bg-surface-muted p-5">
          {result ? (
            <dl className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="flex justify-between gap-4">
                  <dt>{row.label}</dt>
                  <dd id={row.id} className="font-semibold tabular-nums text-ink">
                    {money(row.value(result))}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p id="est-error" role="alert" className="font-semibold text-ink">
              Enter a whole number of days from 1 to 365 and a delivery distance from 0 to 500 km.
            </p>
          )}
          <Button id="est-quote" href={quoteHref} className="mt-5 w-full">
            Request a quote for this rental
          </Button>
          <p className="mt-3 text-sm">
            Prices are indicative. The final quote is confirmed by the company.
          </p>
        </div>
      </div>
    </section>
  );
}
