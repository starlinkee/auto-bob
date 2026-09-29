import type { Machine } from "@/lib/machines";
import type { PricingNotes } from "@/lib/pricing-notes";
import { formatMoney } from "@/lib/pricing";

export function RentalTerms({ notes, machine }: { notes: PricingNotes; machine: Machine }) {
  const { currency, deposit, extras } = machine.pricing;
  const terms: { title: string; text: string }[] = [
    {
      title: "Deposit",
      text: `A refundable deposit of ${formatMoney(deposit, currency)} is taken for ${machine.name} and returned after the machine comes back in good order.`,
    },
    { title: "Fuel", text: notes.fuelPolicy },
    {
      title: "Working hours",
      text: `The daily price covers up to ${notes.workingHoursPerDay} working hours per day.`,
    },
    {
      title: "Extra hours",
      text: `Each extra hour beyond ${notes.workingHoursPerDay} h a day is charged at ${formatMoney(extras.extraHour, currency)} for ${machine.name}.`,
    },
    {
      title: "Cleaning",
      text: `A cleaning fee of ${formatMoney(notes.cleaningFee, currency)} applies if the machine is returned unusually dirty.`,
    },
    { title: "Damage", text: notes.damagePolicy },
  ];

  return (
    <section id="pricing-notes" aria-labelledby="pricing-notes-title">
      <h2 id="pricing-notes-title" className="mb-2 text-3xl text-ink">
        Rental terms
      </h2>
      <p className="mb-6 text-sm">
        Deposit and extra-hour rate shown for the machine selected in the estimator:{" "}
        <strong className="text-ink">{machine.name}</strong>.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2">
        {terms.map((term) => (
          <div key={term.title} className="rounded-md border border-border p-4">
            <dt className="font-display text-xl text-ink">{term.title}</dt>
            <dd className="mt-1">{term.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
