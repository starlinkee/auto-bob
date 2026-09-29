import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export type LegalSection = { id: string; title: string; body: ReactNode };

type LegalPageProps = {
  title: string;
  updated: { iso: string; label: string };
  sections: LegalSection[];
};

export function LegalPage({ title, updated, sections }: LegalPageProps) {
  return (
    <Container className="py-12">
      <h1 className="mb-2 text-5xl text-ink">{title}</h1>
      <p id="legal-updated" className="mb-10 text-body">
        Last updated: <time dateTime={updated.iso}>{updated.label}</time>
      </p>
      <div className="max-w-3xl space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
            <h2 id={`${section.id}-title`} className="mb-3 text-2xl text-ink">
              {section.title}
            </h2>
            <div className="space-y-3 text-body">{section.body}</div>
          </section>
        ))}
      </div>
    </Container>
  );
}
