"use client";

import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { SmartImage } from "@/components/SmartImage";

type GalleryImage = { src: string | null; alt: string };

export function MachineGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const main = images[active] ?? images[0];
  if (!main) return null;

  return (
    <div id="machine-gallery" className="flex flex-col gap-3">
      <button
        type="button"
        data-testid="machine-main-image"
        aria-label={`Open ${name} photo ${active + 1} of ${images.length} in the image viewer`}
        onClick={() => setOpen(active)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border"
      >
        <SmartImage
          image={main}
          slot="Machine – 1200×900"
          width={1200}
          height={900}
          sizes="(min-width: 1024px) 600px, 100vw"
          priority
        />
      </button>
      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3">
          {images.map((image, i) => (
            <li key={`${image.src ?? "placeholder"}-${i}`}>
              <button
                type="button"
                data-testid="machine-thumb"
                aria-label={`Show photo ${i + 1} of ${images.length}: ${image.alt}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => {
                  setActive(i);
                  setOpen(i);
                }}
                className={`block w-full overflow-hidden rounded-md border-2 ${
                  i === active ? "border-brand" : "border-border"
                }`}
              >
                <SmartImage
                  image={image}
                  slot="Machine gallery – 1600×1200"
                  width={1600}
                  height={1200}
                  sizes="150px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Lightbox
        items={images.map((image) => ({ image, caption: image.alt }))}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={(i) => {
          setOpen(i);
          setActive(i);
        }}
        slot="Machine gallery – 1600×1200"
      />
    </div>
  );
}
