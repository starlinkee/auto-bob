import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/SmartImage";
import { getAbout } from "@/lib/about";
import { getSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `Our story, mission, fleet care and safety standards, and the certifications behind ${getSite().name}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const site = getSite();
  const about = getAbout();
  return (
    <Container>
      <h1 className="pt-12 text-5xl text-ink">About {site.name}</h1>
      <Section id="about-story" title="Our story">
        <div className="max-w-3xl space-y-4 text-body">
          {about.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Section>
      <Section id="about-mission" title="Our mission">
        <p className="max-w-3xl text-lg text-body">{about.mission}</p>
      </Section>
      <Section id="about-safety" title="Fleet care and safety">
        <ul className="max-w-3xl list-disc space-y-2 pl-6 text-body">
          {about.safety.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
      <Section id="about-certifications" title="Certifications">
        <ul className="grid gap-4 md:grid-cols-3">
          {about.certifications.map((cert) => (
            <li key={cert.name} className="rounded-md border border-border bg-surface p-4">
              <p className="font-semibold text-ink">{cert.name}</p>
              <p className="text-body">
                {cert.issuer}, {cert.year}
              </p>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="about-team" title="The team">
        <SmartImage
          image={about.teamImage}
          slot="Team – 1200×800"
          width={1200}
          height={800}
          sizes="(min-width: 1200px) 1200px, 100vw"
          className="h-auto w-full rounded-md"
        />
      </Section>
      <Section id="about-depot" title="Our depot">
        <SmartImage
          image={about.depotImage}
          slot="Depot – 1200×800"
          width={1200}
          height={800}
          sizes="(min-width: 1200px) 1200px, 100vw"
          className="h-auto w-full rounded-md"
        />
      </Section>
      <Section id="about-cta" title="Need a machine?">
        <p className="mb-6 max-w-3xl text-body">
          Tell us about your project and we will come back with the right machine and a quote.
        </p>
        <Button href="/contact">Contact us</Button>
      </Section>
    </Container>
  );
}
