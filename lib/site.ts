import { z } from "zod";
import siteJson from "../content/site.json" with { type: "json" };

export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().min(1),
  address: z.object({
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
  }),
  geo: z.object({ lat: z.number(), lng: z.number() }),
  hours: z.array(z.object({ days: z.string().min(1), open: z.string().min(1) })),
  serviceArea: z.string().min(1),
  socials: z.array(z.object({ label: z.string().min(1), url: z.string().min(1) })),
  stats: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),
});

export type Site = z.infer<typeof siteSchema>;

export function getSite(): Site {
  const site = siteSchema.parse(siteJson);
  const lat = process.env.NEXT_PUBLIC_BUSINESS_LAT;
  const lng = process.env.NEXT_PUBLIC_BUSINESS_LNG;
  if (lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return { ...site, geo: { lat: Number(lat), lng: Number(lng) } };
  }
  return site;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function directionsUrl(site: Site): string {
  const { street, postalCode, city, country } = site.address;
  const destination = `${street}, ${postalCode} ${city}, ${country}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
