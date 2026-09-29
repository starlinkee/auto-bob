import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { getSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of rental",
  description: `General terms for renting machinery from ${getSite().name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const site = getSite();
  const { street, postalCode, city, country } = site.address;
  return (
    <LegalPage
      title="Terms of rental"
      updated={{ iso: "2026-01-15", label: "15 January 2026" }}
      sections={[
        {
          id: "terms-parties",
          title: "Scope",
          body: (
            <p>
              These general terms apply to every machine rental from {site.name}, {street},{" "}
              {postalCode} {city}, {country}. Current prices are listed on the{" "}
              <Link href="/pricing" className="underline">
                pricing page
              </Link>
              ; questions can be sent to{" "}
              <a href={`mailto:${site.email}`} className="underline">
                {site.email}
              </a>
              .
            </p>
          ),
        },
        {
          id: "terms-deposit",
          title: "Deposit",
          body: (
            <p>
              A refundable deposit is taken when the machine is handed over. It is returned after
              the machine is back in the agreed condition, less any amounts due for damage, missing
              equipment or additional charges.
            </p>
          ),
        },
        {
          id: "terms-fuel",
          title: "Fuel",
          body: (
            <p>
              Machines are handed over with a full tank and should be returned with a full tank.
              Missing fuel is charged at the market price plus a refuelling fee.
            </p>
          ),
        },
        {
          id: "terms-hours",
          title: "Working-hours limit",
          body: (
            <p>
              Each rental day includes a limited number of engine hours, stated in the rental
              agreement. Hours beyond the limit are charged per additional hour.
            </p>
          ),
        },
        {
          id: "terms-damage",
          title: "Damage and liability",
          body: (
            <p>
              The renter is responsible for the machine from handover to return and must use it only
              as intended, by qualified operators. Damage beyond normal wear, loss and repairs
              caused by misuse are charged to the renter. Please report any fault or accident to us
              immediately.
            </p>
          ),
        },
        {
          id: "terms-cancellation",
          title: "Cancellation",
          body: (
            <p>
              You may cancel a reservation free of charge within a reasonable period before the
              start of the rental, as stated in the agreement. Late cancellations may be charged a
              part of the first rental day.
            </p>
          ),
        },
      ]}
    />
  );
}
