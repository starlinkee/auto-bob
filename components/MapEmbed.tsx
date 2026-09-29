import { getSite } from "@/lib/site";

type MapEmbedProps = { variant: "compact" | "full"; id?: string };

export function MapEmbed({ variant, id }: MapEmbedProps) {
  const site = getSite();
  const { lat, lng } = site.geo;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${lat},${lng}`
    : `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div id={id} className={variant === "compact" ? "h-44 w-full" : "h-96 w-full md:h-[28rem]"}>
      <iframe
        src={src}
        title={`Map showing ${site.name} location`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full rounded-md border-0"
      />
    </div>
  );
}
