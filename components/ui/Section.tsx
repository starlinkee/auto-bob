import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, title, children, className = "" }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      className={`py-12 md:py-16 ${className}`}
    >
      {title ? (
        <h2 id={`${id}-title`} className="mb-8 text-3xl text-ink md:text-4xl">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
