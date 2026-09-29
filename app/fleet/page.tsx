import type { Metadata } from "next";
import { Suspense } from "react";
import { FleetCatalogue } from "@/components/fleet/FleetCatalogue";
import { Container } from "@/components/ui/Container";
import { getMachines } from "@/lib/machines";

export const metadata: Metadata = {
  title: "Our fleet",
  description: "Browse our construction machinery: filter by category, weight and power.",
  alternates: { canonical: "/fleet" },
};

export default function FleetPage() {
  const machines = getMachines();
  return (
    <Container className="py-12">
      <h1 className="mb-8 text-5xl text-ink">Our fleet</h1>
      <Suspense fallback={null}>
        <FleetCatalogue machines={machines} />
      </Suspense>
    </Container>
  );
}
