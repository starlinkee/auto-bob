import { CATEGORIES, capacityValue, enginePowerKw, operatingWeightKg } from "@/lib/fleet";
import type { CategoryId } from "@/lib/fleet";
import type { Machine } from "@/lib/machine-schema";
import { fromPrice } from "@/lib/pricing";

export const WEIGHT_CLASSES = [
  { id: "lt-3t", label: "Under 3 t", test: (kg: number) => kg < 3000 },
  { id: "3-10t", label: "3–10 t", test: (kg: number) => kg >= 3000 && kg < 10000 },
  { id: "10-20t", label: "10–20 t", test: (kg: number) => kg >= 10000 && kg < 20000 },
  { id: "gt-20t", label: "Over 20 t", test: (kg: number) => kg >= 20000 },
] as const;

export const POWER_CLASSES = [
  { id: "lt-25kw", label: "Under 25 kW", test: (kw: number) => kw < 25 },
  { id: "25-75kw", label: "25–75 kW", test: (kw: number) => kw >= 25 && kw <= 75 },
  { id: "gt-75kw", label: "Over 75 kW", test: (kw: number) => kw > 75 },
] as const;

export const SORTS = [
  { id: "name", label: "Name (A–Z)" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "capacity-desc", label: "Capacity: high to low" },
] as const;

export type WeightClass = (typeof WEIGHT_CLASSES)[number]["id"];
export type PowerClass = (typeof POWER_CLASSES)[number]["id"];
export type SortId = (typeof SORTS)[number]["id"];

export type FleetFilters = {
  q: string;
  category: CategoryId | "";
  weight: WeightClass | "";
  power: PowerClass | "";
  available: boolean;
  operator: boolean;
  sort: SortId;
};

export const DEFAULT_FILTERS: FleetFilters = {
  q: "",
  category: "",
  weight: "",
  power: "",
  available: false,
  operator: false,
  sort: "name",
};

function oneOf<T extends string>(options: readonly { id: T }[], value: string | null): T | "" {
  return options.find((option) => option.id === value)?.id ?? "";
}

/** Reads filters from URL parameters; unknown values fall back to the defaults. */
export function parseFilters(params: { get(name: string): string | null }): FleetFilters {
  return {
    q: params.get("q") ?? "",
    category: oneOf(CATEGORIES, params.get("category")),
    weight: oneOf(WEIGHT_CLASSES, params.get("weight")),
    power: oneOf(POWER_CLASSES, params.get("power")),
    available: params.get("available") === "1",
    operator: params.get("operator") === "1",
    sort: oneOf(SORTS, params.get("sort")) || DEFAULT_FILTERS.sort,
  };
}

/** Builds the query string (without "?"), leaving default values out. */
export function serializeFilters(filters: FleetFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.weight) params.set("weight", filters.weight);
  if (filters.power) params.set("power", filters.power);
  if (filters.available) params.set("available", "1");
  if (filters.operator) params.set("operator", "1");
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  return params.toString();
}

function matchesClass<T extends { id: string; test: (n: number) => boolean }>(
  classes: readonly T[],
  id: string,
  value: number | null,
): boolean {
  if (!id) return true;
  if (value === null) return false;
  return classes.find((c) => c.id === id)?.test(value) ?? true;
}

export function matchesFilters(m: Machine, f: FleetFilters): boolean {
  const query = f.q.trim().toLowerCase();
  if (query) {
    const haystack = [m.name, m.manufacturer, m.model].join("\n").toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (f.category && m.category !== f.category) return false;
  if (!matchesClass(WEIGHT_CLASSES, f.weight, operatingWeightKg(m))) return false;
  if (!matchesClass(POWER_CLASSES, f.power, enginePowerKw(m))) return false;
  if (f.available && !m.available) return false;
  if (f.operator && !m.operatorAvailable) return false;
  return true;
}

const byName = (a: Machine, b: Machine) => a.name.localeCompare(b.name, "en");

export function sortMachines(machines: Machine[], sort: SortId): Machine[] {
  const sorted = [...machines];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => fromPrice(a.pricing) - fromPrice(b.pricing) || byName(a, b));
    case "price-desc":
      return sorted.sort((a, b) => fromPrice(b.pricing) - fromPrice(a.pricing) || byName(a, b));
    case "capacity-desc":
      return sorted.sort((a, b) => {
        const ca = capacityValue(a);
        const cb = capacityValue(b);
        if (ca === null && cb === null) return byName(a, b);
        if (ca === null) return 1;
        if (cb === null) return -1;
        return cb - ca || byName(a, b);
      });
    default:
      return sorted.sort(byName);
  }
}

export function applyFilters(machines: Machine[], f: FleetFilters): Machine[] {
  return sortMachines(
    machines.filter((m) => matchesFilters(m, f)),
    f.sort,
  );
}
