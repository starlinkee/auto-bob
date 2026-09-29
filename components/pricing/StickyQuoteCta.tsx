import { Button } from "@/components/ui/Button";

/** Fixed bar at the bottom of the viewport below 1024 px; sticky in the side column from 1024 px. */
export function StickyQuoteCta() {
  return (
    <aside
      id="pricing-sticky-cta"
      aria-label="Request a quote"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 lg:sticky lg:inset-x-auto lg:top-24 lg:rounded-md lg:border lg:p-5"
    >
      <p className="mb-3 hidden text-sm text-body lg:block">
        Need a firm price for your job? Tell us the machine and dates and we will confirm the quote.
      </p>
      <Button href="/contact" className="w-full">
        Request a quote
      </Button>
    </aside>
  );
}
