import { z } from "zod";
import { imageSchema } from "@/lib/images";

const positive = z.number().positive();
const dimensionsSchema = z.object({ length: positive, width: positive, height: positive });
const fuelTypeSchema = z.enum(["diesel", "petrol", "electric", "none"]);

const commonSpecs = {
  operatingWeightKg: positive,
  enginePowerKw: positive,
  fuelType: fuelTypeSchema,
  emissionStandard: z.string().min(1),
  dimensionsMm: dimensionsSchema,
  transportDimensionsMm: dimensionsSchema.optional(),
};

const liftSpecs = {
  ratedOperatingCapacityKg: positive,
  bucketVolumeM3: positive,
  breakoutForceKn: positive,
  liftHeightM: positive,
  tippingLoadKg: positive,
};

const compactionSpecs = {
  drumWidthMm: positive,
  centrifugalForceKn: positive,
  frequencyHz: positive,
  workingWidthMm: positive,
};

const excavatorSpecs = z.object({
  ...commonSpecs,
  bucketCapacityM3: positive,
  maxDiggingDepthM: positive,
  maxReachM: positive,
  maxDumpHeightM: positive,
  trackWidthMm: positive,
  tailSwing: z.enum(["zero", "reduced", "conventional"]),
  quickCoupler: z.boolean(),
});

const loaderSpecs = z.object({ ...commonSpecs, ...liftSpecs });

const dumperSpecs = z.object({
  ...commonSpecs,
  payloadT: positive,
  bodyVolumeM3: positive,
  maxSpeedKmh: positive,
  driveType: z.string().min(1),
});

const rollerSpecs = z.object({ ...commonSpecs, ...compactionSpecs });

const telehandlerSpecs = z.object({
  ...commonSpecs,
  maxLiftHeightM: positive,
  maxCapacityKg: positive,
  maxReachM: positive,
  attachmentOptions: z.array(z.string().min(1)),
});

const attachmentSpecs = z.object({
  operatingWeightKg: positive.optional(),
  enginePowerKw: positive.optional(),
  fuelType: fuelTypeSchema.optional(),
  emissionStandard: z.string().min(1).optional(),
  dimensionsMm: dimensionsSchema,
  transportDimensionsMm: dimensionsSchema.optional(),
  compatibleMachines: z.array(z.string().min(1)),
  weightKg: positive,
});

export const pricingSchema = z
  .object({
    currency: z.string().length(3),
    vatRate: z.number().min(0).max(1),
    deposit: z.number().min(0),
    tiers: z
      .array(
        z.object({
          fromDays: z.number().int().min(1),
          toDays: z.number().int().min(1).nullable(),
          perDay: positive,
        }),
      )
      .min(1),
    extras: z.object({
      operatorPerDay: positive.nullable(),
      deliveryPerKm: z.number().min(0),
      extraHour: z.number().min(0),
    }),
  })
  .superRefine((pricing, ctx) => {
    const { tiers } = pricing;
    const fail = (index: number, message: string) =>
      ctx.addIssue({ code: "custom", path: ["tiers", index], message });
    if (tiers[0].fromDays !== 1) fail(0, "the first tier must start at day 1");
    tiers.forEach((tier, index) => {
      const isLast = index === tiers.length - 1;
      if (tier.toDays === null && !isLast) {
        fail(index, "only the last tier may have toDays: null");
      }
      if (tier.toDays !== null && tier.toDays < tier.fromDays) {
        fail(index, "toDays must not be lower than fromDays");
      }
      if (isLast && tier.toDays !== null) fail(index, "the last tier must have toDays: null");
      const previous = tiers[index - 1];
      if (previous) {
        if (previous.toDays !== null && tier.fromDays !== previous.toDays + 1) {
          fail(index, "tiers must be contiguous (fromDays = previous toDays + 1)");
        }
        if (tier.perDay > previous.perDay) fail(index, "perDay must not increase between tiers");
      }
    });
  });

const base = {
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lower-case kebab-case"),
  name: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int(),
  featured: z.boolean(),
  available: z.boolean(),
  operatorRequired: z.boolean(),
  operatorAvailable: z.boolean(),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  images: z.array(imageSchema).min(1),
  features: z.array(z.string().min(1)),
  included: z.array(z.string().min(1)),
  notIncluded: z.array(z.string().min(1)),
  pricing: pricingSchema,
  datasheetUrl: z.string().min(1).nullable(),
};

export const machineSchema = z.discriminatedUnion("category", [
  z.object({ ...base, category: z.literal("excavator"), specs: excavatorSpecs }),
  z.object({ ...base, category: z.literal("loader"), specs: loaderSpecs }),
  z.object({ ...base, category: z.literal("skid-steer"), specs: loaderSpecs }),
  z.object({ ...base, category: z.literal("dumper"), specs: dumperSpecs }),
  z.object({ ...base, category: z.literal("roller"), specs: rollerSpecs }),
  z.object({ ...base, category: z.literal("telehandler"), specs: telehandlerSpecs }),
  z.object({ ...base, category: z.literal("compactor"), specs: rollerSpecs }),
  z.object({ ...base, category: z.literal("attachment"), specs: attachmentSpecs }),
]);

export type Machine = z.infer<typeof machineSchema>;
export type Pricing = z.infer<typeof pricingSchema>;

/** Validates one machine file; errors name the file and the path of the bad field. */
export function parseMachine(raw: unknown, fileName: string): Machine {
  const result = machineSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`${fileName}: invalid machine: ${details}`);
  }
  const expected = fileName.replace(/\.json$/, "");
  if (result.data.slug !== expected) {
    throw new Error(
      `${fileName}: slug: "${result.data.slug}" must equal the file name "${expected}"`,
    );
  }
  return result.data;
}
