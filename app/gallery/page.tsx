import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { GalleryView } from "@/components/gallery/GalleryView";
import { GALLERY_CATEGORIES, getGallery } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of our machines, job sites, deliveries and team.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const items = getGallery();
  return (
    <Container className="py-12">
      <h1 className="mb-8 text-5xl text-ink">Gallery</h1>
      <GalleryView items={items} categories={GALLERY_CATEGORIES.map((c) => ({ ...c }))} />
    </Container>
  );
}
