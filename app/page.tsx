import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { getSite } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${getSite().name} – ${getSite().tagline}` },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const site = getSite();
  return (
    <Container className="py-12">
      <h1 id="home-title" className="mb-6 text-5xl text-ink">
        {site.name}
      </h1>
      <ImagePlaceholder label="Hero – 1920×900" width={1920} height={900} />
    </Container>
  );
}
