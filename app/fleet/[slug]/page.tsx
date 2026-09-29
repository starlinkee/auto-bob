import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MachineCard } from "@/components/MachineCard";
import { MachineGallery } from "@/components/machine/MachineGallery";
import { RentalEstimator } from "@/components/machine/RentalEstimator";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { categoryLabel, specRows } from "@/lib/fleet";
import { getMachine, getMachines } from "@/lib/machines";
import type { Machine } from "@/lib/machines";
import { formatMoney, fromPrice, TIER_COLUMNS, withVat } from "@/lib/pricing";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getMachines().map((machine) => ({ slug: machine.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const machine = getMachine(slug);
  if (!machine) return {};
  return {
    title: machine.name,
    description: machine.shortDescription,
    alternates: { canonical: `/fleet/${machine.slug}` },
  };
}

function relatedMachines(machine: Machine): Machine[] {
  const others = getMachines().filter((m) => m.slug !== machine.slug);
  const sameCategory = others.filter((m) => m.category === machine.category);
  const rest = others.filter((m) => m.category !== machine.category);
  return [...sameCategory, ...rest].slice(0, 3);
}

function jsonLd(machine: Machine): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: machine.name,
    description: machine.description,
    brand: { "@type": "Brand", name: machine.manufacturer },
    category: categoryLabel(machine.category),
    offers: {
      "@type": "Offer",
      price: fromPrice(machine.pricing),
      priceCurrency: machine.pricing.currency,
      availability: machine.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const cell = "border-b border-border px-3 py-2 text-left";

export default async function MachinePage({ params }: Props) {
  const { slug } = await params;
  const machine = getMachine(slug);
  if (!machine) notFound();

  const { pricing } = machine;
  const money = (amount: number) => formatMoney(amount, pricing.currency);
  const operatorRate = pricing.extras.operatorPerDay;
  const related = relatedMachines(machine);

  return (
    <Container className="py-12">
      <script
        type="application/ld+json"
        id="machine-jsonld"
        dangerouslySetInnerHTML={{ __html: jsonLd(machine) }}
      />
      <div className="grid gap-10 lg:grid-cols-2">
        <MachineGallery images={machine.images} name={machine.name} />
        <div className="flex flex-col gap-4">
          <p>
            <Link
              id="machine-category"
              href={`/fleet?category=${machine.category}`}
              className="font-semibold text-ink underline"
            >
              {categoryLabel(machine.category)}
            </Link>
          </p>
          <h1 id="machine-title" className="text-5xl text-ink">
            {machine.name}
          </h1>
          <p id="machine-subtitle" className="text-body">
            {machine.manufacturer} {machine.model}, {machine.year}
          </p>
          <div id="machine-availability">
            <Badge tone={machine.available ? "success" : "neutral"}>
              {machine.available ? "Available" : "Currently rented"}
            </Badge>
          </div>
          <p className="text-lg text-ink">{machine.shortDescription}</p>
          <p>{machine.description}</p>
          <p id="machine-datasheet">
            {machine.datasheetUrl ? (
              <a href={machine.datasheetUrl} download className="font-semibold text-ink underline">
                Download the spec sheet
              </a>
            ) : (
              "Spec sheet on request"
            )}
          </p>
        </div>
      </div>

      <Section id="machine-specs" title="Specifications">
        <table className="w-full max-w-3xl border-collapse">
          <caption className="sr-only">Specifications of {machine.name}</caption>
          <tbody>
            {specRows(machine).map((row) => (
              <tr key={row.key}>
                <th scope="row" className={`${cell} font-semibold text-ink`}>
                  {row.label}
                </th>
                <td className={cell}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="machine-prices" title="Prices">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <table className="w-full border-collapse">
              <caption className="sr-only">Rental price per day by duration</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${cell} text-ink`}>
                    Duration
                  </th>
                  <th scope="col" className={`${cell} text-ink`}>
                    Net per day
                  </th>
                  <th scope="col" className={`${cell} text-ink`}>
                    Gross per day
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricing.tiers.map((tier, i) => (
                  <tr key={tier.fromDays} data-testid="price-tier">
                    <th scope="row" className={`${cell} font-semibold text-ink`}>
                      {TIER_COLUMNS[i] ?? `${tier.fromDays}+ days`}
                    </th>
                    <td className={cell}>{money(tier.perDay)}</td>
                    <td className={cell}>{money(withVat(tier.perDay, pricing.vatRate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full border-collapse">
              <caption className="sr-only">Deposit and extras</caption>
              <tbody>
                <tr>
                  <th scope="row" className={`${cell} font-semibold text-ink`}>
                    Deposit
                  </th>
                  <td id="price-deposit" className={cell}>
                    {money(pricing.deposit)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={`${cell} font-semibold text-ink`}>
                    Operator per day
                  </th>
                  <td id="price-operator" className={cell}>
                    {operatorRate === null ? "Not available" : money(operatorRate)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={`${cell} font-semibold text-ink`}>
                    Delivery per km
                  </th>
                  <td id="price-delivery" className={cell}>
                    {money(pricing.extras.deliveryPerKm)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={`${cell} font-semibold text-ink`}>
                    Extra hour
                  </th>
                  <td id="price-extra-hour" className={cell}>
                    {money(pricing.extras.extraHour)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <RentalEstimator machine={machine} />
        </div>
      </Section>

      <Section id="machine-details" className="grid gap-8 md:grid-cols-3">
        <div id="machine-included">
          <h2 className="mb-4 text-2xl text-ink">Included</h2>
          <ul className="list-disc pl-5">
            {machine.included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div id="machine-not-included">
          <h2 className="mb-4 text-2xl text-ink">Not included</h2>
          <ul className="list-disc pl-5">
            {machine.notIncluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div id="machine-features">
          <h2 className="mb-4 text-2xl text-ink">Features</h2>
          <ul className="list-disc pl-5">
            {machine.features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section id="related-machines" title="Related machines">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((m) => (
              <MachineCard key={m.slug} machine={m} />
            ))}
          </div>
        </Section>
      ) : null}
    </Container>
  );
}
