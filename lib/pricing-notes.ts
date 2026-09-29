import { z } from "zod";
import notesJson from "../content/pricing-notes.json" with { type: "json" };

const pricingNotesSchema = z.object({
  fuelPolicy: z.string().min(1),
  workingHoursPerDay: z.number().int().min(1).max(24),
  cleaningFee: z.number().min(0),
  damagePolicy: z.string().min(1),
});

export type PricingNotes = z.infer<typeof pricingNotesSchema>;

/** Server only: reads and validates content/pricing-notes.json. */
export function getPricingNotes(): PricingNotes {
  return pricingNotesSchema.parse(notesJson);
}
