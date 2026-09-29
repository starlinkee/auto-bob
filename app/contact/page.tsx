import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { MapEmbed } from "@/components/MapEmbed";
import { QuoteForm } from "@/components/contact/QuoteForm";
import { getMachines } from "@/lib/machines";
import { directionsUrl, getSite, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Request a quote for construction machinery rental, or find our address, phone, opening hours and directions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const site = getSite();
  const machines = getMachines().map(({ slug, name }) => ({ slug, name }));
  const { street, postalCode, city, country } = site.address;

  return (
    <Container className="py-12">
      <h1 className="mb-8 text-5xl text-ink">Contact us</h1>
      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="quote-title">
          <h2 id="quote-title" className="mb-4 text-3xl text-ink">
            Request a quote
          </h2>
          <Suspense>
            <QuoteForm machines={machines} />
          </Suspense>
        </section>
        <section aria-labelledby="details-title" className="space-y-6 text-body">
          <h2 id="details-title" className="text-3xl text-ink">
            Visit or call us
          </h2>
          <address id="contact-address" className="not-italic">
            {street}
            <br />
            {postalCode} {city}
            <br />
            {country}
          </address>
          <p>
            Phone:{" "}
            <a
              id="contact-phone-link"
              href={telHref(site.phone)}
              className="font-semibold text-ink underline"
            >
              {site.phone}
            </a>
            <br />
            E-mail:{" "}
            <a
              id="contact-email-link"
              href={`mailto:${site.email}`}
              className="font-semibold text-ink underline"
            >
              {site.email}
            </a>
          </p>
          <div id="contact-hours">
            <h3 className="mb-2 text-xl text-ink">Opening hours</h3>
            <ul>
              {site.hours.map((entry) => (
                <li key={entry.days}>
                  {entry.days}: {entry.open}
                </li>
              ))}
            </ul>
          </div>
          <p>
            <a
              id="contact-directions"
              href={directionsUrl(site)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline"
            >
              Get directions (opens in a new tab)
            </a>
          </p>
          <p id="contact-service-area">
            <strong className="text-ink">Service area:</strong> {site.serviceArea}
          </p>
        </section>
      </div>
      <div className="mt-12">
        <MapEmbed variant="full" id="contact-map" />
      </div>
    </Container>
  );
}
