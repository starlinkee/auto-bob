import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Badge } from "@/components/ui/Badge";
import { categoryLabel, keySpecs } from "@/lib/fleet";
import type { Machine } from "@/lib/machine-schema";
import { formatMoney, fromPrice } from "@/lib/pricing";

export function MachineCard({ machine }: { machine: Machine }) {
  const { slug, name, category, images, pricing, available } = machine;
  return (
    <article
      data-testid="machine-card"
      data-slug={slug}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
    >
      <SmartImage
        image={images[0]}
        slot="Machine – 1200×900"
        width={1200}
        height={900}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-body">{categoryLabel(category)}</p>
            <h3 className="text-xl font-bold text-ink">{name}</h3>
          </div>
          <Badge tone={available ? "success" : "neutral"}>
            {available ? "Available" : "Currently rented"}
          </Badge>
        </div>
        <dl className="grid grid-cols-1 gap-1 text-sm">
          {keySpecs(machine).map((spec) => (
            <div key={spec.label} className="flex justify-between gap-3">
              <dt className="text-body">{spec.label}</dt>
              <dd className="font-semibold text-ink">{spec.value}</dd>
            </div>
          ))}
        </dl>
        <p data-testid="machine-card-price" className="mt-auto font-semibold text-ink">
          from {formatMoney(fromPrice(pricing), pricing.currency)} / day
        </p>
        <Link
          href={`/fleet/${slug}`}
          data-testid="machine-card-link"
          className="font-semibold text-ink underline"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
