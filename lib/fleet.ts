import type { Machine } from "@/lib/machine-schema";

export type CategoryId =
  | "excavator"
  | "loader"
  | "skid-steer"
  | "dumper"
  | "roller"
  | "telehandler"
  | "compactor"
  | "attachment";

export const CATEGORIES: readonly { id: CategoryId; label: string; plural: string }[] = [
  { id: "excavator", label: "Excavator", plural: "Excavators" },
  { id: "loader", label: "Loader", plural: "Loaders" },
  { id: "skid-steer", label: "Skid steer", plural: "Skid steers" },
  { id: "dumper", label: "Dumper", plural: "Dumpers" },
  { id: "roller", label: "Roller", plural: "Rollers" },
  { id: "telehandler", label: "Telehandler", plural: "Telehandlers" },
  { id: "compactor", label: "Compactor", plural: "Compactors" },
  { id: "attachment", label: "Attachment", plural: "Attachments" },
];

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

type SpecRow = { key: string; label: string; value: string };
type Specs = Record<string, unknown>;
type Format = (value: never) => string;

const number = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const unit = (suffix: string) => (value: number) => `${number(value)} ${suffix}`;
const text = (value: string) => value;
const yesNo = (value: boolean) => (value ? "Yes" : "No");
const list = (value: string[]) => value.join(", ");
const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const HP_PER_KW = 1.34102;

function power(kw: number): string {
  return `${number(kw)} kW (${Math.round(kw * HP_PER_KW)} HP)`;
}

function dimensions(value: { length: number; width: number; height: number }): string {
  return `${number(value.length)} × ${number(value.width)} × ${number(value.height)} mm`;
}

type Field = { key: string; label: string; format: Format };

function field<T>(key: string, label: string, format: (value: T) => string): Field {
  return { key, label, format: format as unknown as Format };
}

const COMMON_FIELDS: Field[] = [
  field("operatingWeightKg", "Operating weight", unit("kg")),
  field("enginePowerKw", "Engine power", power),
  field("fuelType", "Fuel", (value: string) => capitalise(value)),
  field("emissionStandard", "Emission standard", text),
  field("dimensionsMm", "Dimensions (L × W × H)", dimensions),
  field("transportDimensionsMm", "Transport dimensions (L × W × H)", dimensions),
];

const CATEGORY_FIELDS: Record<CategoryId, Field[]> = {
  excavator: [
    field("bucketCapacityM3", "Bucket capacity", unit("m³")),
    field("maxDiggingDepthM", "Max digging depth", unit("m")),
    field("maxReachM", "Max reach", unit("m")),
    field("maxDumpHeightM", "Max dump height", unit("m")),
    field("trackWidthMm", "Track width", unit("mm")),
    field("tailSwing", "Tail swing", (value: string) => capitalise(value)),
    field("quickCoupler", "Quick coupler", yesNo),
  ],
  loader: [
    field("ratedOperatingCapacityKg", "Rated operating capacity", unit("kg")),
    field("bucketVolumeM3", "Bucket volume", unit("m³")),
    field("breakoutForceKn", "Breakout force", unit("kN")),
    field("liftHeightM", "Lift height", unit("m")),
    field("tippingLoadKg", "Tipping load", unit("kg")),
  ],
  "skid-steer": [
    field("ratedOperatingCapacityKg", "Rated operating capacity", unit("kg")),
    field("bucketVolumeM3", "Bucket volume", unit("m³")),
    field("breakoutForceKn", "Breakout force", unit("kN")),
    field("liftHeightM", "Lift height", unit("m")),
    field("tippingLoadKg", "Tipping load", unit("kg")),
  ],
  dumper: [
    field("payloadT", "Payload", unit("t")),
    field("bodyVolumeM3", "Body volume", unit("m³")),
    field("maxSpeedKmh", "Max speed", unit("km/h")),
    field("driveType", "Drive", text),
  ],
  roller: [
    field("drumWidthMm", "Drum width", unit("mm")),
    field("centrifugalForceKn", "Centrifugal force", unit("kN")),
    field("frequencyHz", "Frequency", unit("Hz")),
    field("workingWidthMm", "Working width", unit("mm")),
  ],
  compactor: [
    field("drumWidthMm", "Drum width", unit("mm")),
    field("centrifugalForceKn", "Centrifugal force", unit("kN")),
    field("frequencyHz", "Frequency", unit("Hz")),
    field("workingWidthMm", "Working width", unit("mm")),
  ],
  telehandler: [
    field("maxLiftHeightM", "Max lift height", unit("m")),
    field("maxCapacityKg", "Max capacity", unit("kg")),
    field("maxReachM", "Max reach", unit("m")),
    field("attachmentOptions", "Attachment options", list),
  ],
  attachment: [
    field("compatibleMachines", "Compatible machines", list),
    field("weightKg", "Weight", unit("kg")),
  ],
};

const CAPACITY_KEY: Record<CategoryId, string> = {
  excavator: "bucketCapacityM3",
  loader: "ratedOperatingCapacityKg",
  "skid-steer": "ratedOperatingCapacityKg",
  dumper: "payloadT",
  roller: "drumWidthMm",
  telehandler: "maxCapacityKg",
  compactor: "drumWidthMm",
  attachment: "weightKg",
};

function specsOf(m: Machine): Specs {
  return m.specs as Specs;
}

function rowFor(specs: Specs, f: Field): SpecRow | null {
  const value = specs[f.key];
  if (value === undefined || value === null) return null;
  return { key: f.key, label: f.label, value: (f.format as (v: unknown) => string)(value) };
}

export function specRows(m: Machine): SpecRow[] {
  const specs = specsOf(m);
  return [...COMMON_FIELDS, ...CATEGORY_FIELDS[m.category]]
    .map((f) => rowFor(specs, f))
    .filter((row): row is SpecRow => row !== null);
}

function numeric(m: Machine, key: string): number | null {
  const value = specsOf(m)[key];
  return typeof value === "number" ? value : null;
}

export function operatingWeightKg(m: Machine): number | null {
  return numeric(m, "operatingWeightKg");
}

export function enginePowerKw(m: Machine): number | null {
  return numeric(m, "enginePowerKw");
}

export function capacityValue(m: Machine): number | null {
  return numeric(m, CAPACITY_KEY[m.category]);
}

export function keySpecs(m: Machine): { label: string; value: string }[] {
  const specs = specsOf(m);
  const capacity = CATEGORY_FIELDS[m.category].find((f) => f.key === CAPACITY_KEY[m.category]);
  const fields = [COMMON_FIELDS[0], COMMON_FIELDS[1], capacity];
  return fields
    .map((f) => (f ? rowFor(specs, f) : null))
    .filter((row): row is SpecRow => row !== null)
    .slice(0, 3)
    .map(({ label, value }) => ({ label, value }));
}
