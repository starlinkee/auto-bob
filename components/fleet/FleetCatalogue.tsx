"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MachineCard } from "@/components/MachineCard";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/fleet";
import {
  POWER_CLASSES,
  SORTS,
  WEIGHT_CLASSES,
  DEFAULT_FILTERS,
  applyFilters,
  parseFilters,
  serializeFilters,
} from "@/lib/fleet-filters";
import type { FleetFilters } from "@/lib/fleet-filters";
import type { Machine } from "@/lib/machine-schema";

const CONTROL =
  "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

function Check({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-brand"
      />
      <label htmlFor={id} className="text-ink">
        {label}
      </label>
    </div>
  );
}

export function FleetCatalogue({ machines }: { machines: Machine[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Local state is the source of truth so controls respond instantly; the URL mirrors it and is read on load.
  const [filters, setFilters] = useState<FleetFilters>(() => parseFilters(searchParams));

  function update(patch: Partial<FleetFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const query = serializeFilters(next);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
    router.replace(pathname, { scroll: false });
  }

  const visible = useMemo(() => applyFilters(machines, filters), [machines, filters]);

  return (
    <>
      <form
        role="search"
        aria-label="Filter the fleet"
        onSubmit={(event) => event.preventDefault()}
        className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field id="fleet-search" label="Search">
          <input
            id="fleet-search"
            type="search"
            value={filters.q}
            placeholder="Name, manufacturer or model"
            onChange={(event) => update({ q: event.target.value })}
            className={CONTROL}
          />
        </Field>
        <Field id="fleet-category" label="Category">
          <select
            id="fleet-category"
            value={filters.category}
            onChange={(event) =>
              update({ category: event.target.value as FleetFilters["category"] })
            }
            className={CONTROL}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.plural}
              </option>
            ))}
          </select>
        </Field>
        <Field id="fleet-weight" label="Operating weight">
          <select
            id="fleet-weight"
            value={filters.weight}
            onChange={(event) => update({ weight: event.target.value as FleetFilters["weight"] })}
            className={CONTROL}
          >
            <option value="">Any weight</option>
            {WEIGHT_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="fleet-power" label="Engine power">
          <select
            id="fleet-power"
            value={filters.power}
            onChange={(event) => update({ power: event.target.value as FleetFilters["power"] })}
            className={CONTROL}
          >
            <option value="">Any power</option>
            {POWER_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="fleet-sort" label="Sort by">
          <select
            id="fleet-sort"
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value as FleetFilters["sort"] })}
            className={CONTROL}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Check
          id="fleet-available"
          label="Available now"
          checked={filters.available}
          onChange={(available) => update({ available })}
        />
        <Check
          id="fleet-operator"
          label="Operator available"
          checked={filters.operator}
          onChange={(operator) => update({ operator })}
        />
      </form>

      <p id="fleet-count" role="status" className="mb-6 font-semibold text-ink">
        {visible.length} {visible.length === 1 ? "machine" : "machines"}
      </p>

      {visible.length > 0 ? (
        <div id="fleet-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((machine) => (
            <MachineCard key={machine.slug} machine={machine} />
          ))}
        </div>
      ) : (
        <div
          id="fleet-empty"
          className="rounded-lg border border-border bg-surface-muted p-8 text-center"
        >
          <p className="mb-4 text-lg text-ink">No machines match your filters.</p>
          <Button id="fleet-reset" variant="secondary" onClick={reset}>
            Reset filters
          </Button>
        </div>
      )}
    </>
  );
}
