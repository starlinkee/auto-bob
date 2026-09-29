import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PricingView } from "@/components/pricing/PricingView";
import { getMachines } from "@/lib/machines";
import { getPricingNotes } from "@/lib/pricing-notes";

export const metadata: Metadata = {
  title: "Prices",
  description:
    "Daily rental prices for every machine by rental duration, net or gross, with an estimator for a whole rental and our rental terms.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <Container className="pb-24 pt-12 lg:pb-12">
      <h1 className="mb-8 text-5xl text-ink">Prices</h1>
      <PricingView machines={getMachines()} notes={getPricingNotes()} />
    </Container>
  );
}
