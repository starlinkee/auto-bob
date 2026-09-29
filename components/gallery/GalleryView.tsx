"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Lightbox } from "@/components/Lightbox";
import { SmartImage } from "@/components/SmartImage";

type Category = { id: string; label: string };
type Item = {
  id: string;
  image: { src: string | null; alt: string };
  caption: string;
  category: string;
};

const ALL = "all";
const SLOT = "Gallery – 1600×1067";

export function GalleryView({ items, categories }: { items: Item[]; categories: Category[] }) {
  const tabs: Category[] = [{ id: ALL, label: "All" }, ...categories];
  const [active, setActive] = useState(ALL);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visible = active === ALL ? items : items.filter((item) => item.category === active);

  function select(id: string) {
    setActive(id);
    setOpenIndex(null);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    select(tab.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <div
        id="gallery-tabs"
        role="tablist"
        aria-label="Gallery categories"
        className="mb-8 flex flex-wrap gap-2"
      >
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`gallery-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls="gallery-grid"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, i)}
              className={`min-h-11 rounded-full border px-5 text-sm font-semibold ${
                selected
                  ? "border-brand bg-brand text-brand-ink"
                  : "border-border bg-surface text-ink hover:bg-surface-muted"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id="gallery-grid"
        role="tabpanel"
        aria-labelledby={`gallery-tab-${active}`}
        className="columns-1 gap-4 sm:columns-2 lg:columns-3"
      >
        {visible.map((item, i) => (
          <button
            key={item.id}
            type="button"
            data-testid="gallery-item"
            data-category={item.category}
            aria-label={item.caption}
            onClick={() => setOpenIndex(i)}
            className="card-lift mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg border border-border bg-surface text-left"
          >
            <SmartImage
              image={item.image}
              slot={SLOT}
              width={1600}
              height={1067}
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            />
          </button>
        ))}
      </div>
      <Lightbox
        items={visible}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
        slot={SLOT}
      />
    </>
  );
}
