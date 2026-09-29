"use client";

import { useState } from "react";
import { PriceTables } from "@/components/pricing/PriceTables";
import { Estimator } from "@/components/pricing/Estimator";
import { RentalTerms } from "@/components/pricing/RentalTerms";
import { StickyQuoteCta } from "@/components/pricing/StickyQuoteCta";
import type { Machine } from "@/lib/machines";
import type { PricingNotes } from "@/lib/pricing-notes";

export function PricingView({ machines, notes }: { machines: Machine[]; notes: PricingNotes }) {
  const [slug, setSlug] = useState(machines[0]?.slug ?? "");
  const machine = machines.find((m) => m.slug === slug) ?? machines[0];
  if (!machine) return <p>No machines are available yet.</p>;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
      <div className="min-w-0 space-y-14">
        <PriceTables machines={machines} />
        <Estimator machines={machines} machine={machine} onSelect={setSlug} />
        <RentalTerms notes={notes} machine={machine} />
      </div>
      <StickyQuoteCta />
    </div>
  );
}
