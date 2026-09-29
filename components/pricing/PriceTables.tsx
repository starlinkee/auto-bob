"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CATEGORIES } from "@/lib/fleet";
import type { Machine } from "@/lib/machines";
import { TIER_COLUMNS, formatMoney, tierFor, withVat } from "@/lib/pricing";

type Mode = "net" | "gross";

const OPTIONS: { mode: Mode; label: string }[] = [
  { mode: "net", label: "Net" },
  { mode: "gross", label: "Gross (incl. VAT)" },
];

/** The first day of each TIER_COLUMNS column, used to look up its tier. */
const COLUMN_DAYS = [1, 2, 4, 8, 31];

export function PriceTables({ machines }: { machines: Machine[] }) {
  const [mode, setMode] = useState<Mode>("net");
  const refs = useRef<Record<Mode, HTMLButtonElement | null>>({ net: null, gross: null });

  function onKeyDown(event: React.KeyboardEvent) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next: Mode = mode === "net" ? "gross" : "net";
    setMode(next);
    refs.current[next]?.focus();
  }

  const sections = CATEGORIES.map((category) => ({
    category,
    items: machines.filter((m) => m.category === category.id),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <span id="vat-toggle-label" className="font-semibold text-ink">
          Show prices
        </span>
        <div
          id="vat-toggle"
          role="radiogroup"
          aria-labelledby="vat-toggle-label"
          onKeyDown={onKeyDown}
          className="inline-flex rounded-md border-2 border-ink p-0.5"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.mode}
              ref={(el) => {
                refs.current[option.mode] = el;
              }}
              type="button"
              role="radio"
              aria-checked={mode === option.mode}
              tabIndex={mode === option.mode ? 0 : -1}
              onClick={() => setMode(option.mode)}
              className={`min-h-10 rounded px-4 font-semibold ${
                mode === option.mode ? "bg-brand text-brand-ink" : "text-ink hover:bg-surface-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {sections.map(({ category, items }) => (
        <section
          key={category.id}
          id={`pricing-${category.id}`}
          aria-labelledby={`pricing-${category.id}-title`}
        >
          <h2 id={`pricing-${category.id}-title`} className="mb-3 text-3xl text-ink">
            {category.plural}
          </h2>
          <div
            role="region"
            aria-label={`${category.plural} price list, scrollable`}
            tabIndex={0}
            className="overflow-x-auto rounded-md border border-border"
          >
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-surface-muted text-ink">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Machine
                  </th>
                  {TIER_COLUMNS.map((column) => (
                    <th key={column} scope="col" className="px-4 py-3 text-right font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((machine) => (
                  <tr
                    key={machine.slug}
                    data-slug={machine.slug}
                    className="border-t border-border"
                  >
                    <th scope="row" className="px-4 py-3 font-semibold">
                      <Link href={`/fleet/${machine.slug}`} className="text-ink underline">
                        {machine.name}
                      </Link>
                    </th>
                    {COLUMN_DAYS.map((days, index) => {
                      const perDay = tierFor(machine.pricing, days).perDay;
                      const shown =
                        mode === "net" ? perDay : withVat(perDay, machine.pricing.vatRate);
                      return (
                        <td key={TIER_COLUMNS[index]} className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(shown, machine.pricing.currency)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p id="vat-caption" aria-live="polite" className="text-sm">
        {mode === "net"
          ? "Prices are per day, net of VAT."
          : "Prices are per day, gross, including VAT."}
      </p>
    </div>
  );
}
