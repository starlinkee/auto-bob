import { z } from "zod";
import aboutJson from "../content/about.json" with { type: "json" };
import { assertImageExists, imageSchema } from "./images";

export const aboutSchema = z.object({
  story: z.array(z.string().min(1)).min(1),
  mission: z.string().min(1),
  safety: z.array(z.string().min(1)).min(1),
  certifications: z.array(
    z.object({
      name: z.string().min(1),
      issuer: z.string().min(1),
      year: z.number().int(),
    }),
  ),
  teamImage: imageSchema,
  depotImage: imageSchema,
});

export type About = z.infer<typeof aboutSchema>;

export function getAbout(): About {
  const about = aboutSchema.parse(aboutJson);
  assertImageExists(about.teamImage, "content/about.json");
  assertImageExists(about.depotImage, "content/about.json");
  return about;
}
