import { getSite, type Site } from "@/lib/site";

const DAY_CODES: Record<string, string> = {
  monday: "Mo",
  tuesday: "Tu",
  wednesday: "We",
  thursday: "Th",
  friday: "Fr",
  saturday: "Sa",
  sunday: "Su",
};

/** "Monday – Friday" + "07:00 – 17:00" -> "Mo-Fr 07:00-17:00"; closed days yield nothing. */
function openingHours(entry: Site["hours"][number]): string[] {
  const times = entry.open.split(/\s*[–-]\s*/);
  if (times.length !== 2 || !times.every((t) => /^\d{1,2}:\d{2}$/.test(t))) return [];
  const codes = entry.days.split(/\s*[–-]\s*/).map((day) => DAY_CODES[day.trim().toLowerCase()]);
  if (codes.length === 0 || codes.length > 2 || codes.some((code) => !code)) return [];
  return [`${codes.join("-")} ${times.join("-")}`];
}

export function LocalBusinessJsonLd() {
  const site = getSite();
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.name,
    description: site.tagline,
    telephone: site.phone,
    email: site.email,
    url: base,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    openingHours: site.hours.flatMap(openingHours),
  };
  return (
    <script
      type="application/ld+json"
      id="localbusiness-jsonld"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
