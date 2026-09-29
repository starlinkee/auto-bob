import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MachineCard } from "@/components/MachineCard";
import { getMachine } from "@/lib/machines";

function render(slug: string): string {
  const machine = getMachine(slug);
  if (!machine) throw new Error(`missing sample machine ${slug}`);
  return renderToStaticMarkup(<MachineCard machine={machine} />).replace(/ /g, " ");
}

describe("MachineCard", () => {
  it("renders the article with slug, name heading and category", () => {
    const html = render("kubota-kx057-4");
    expect(html).toContain('<article data-testid="machine-card" data-slug="kubota-kx057-4"');
    expect(html).toMatch(/<h3[^>]*>Kubota KX057-4 Midi Excavator<\/h3>/);
    expect(html).toContain("Excavator");
  });

  it("renders the image placeholder with the machine slot", () => {
    const html = render("kubota-kx057-4");
    expect(html).toContain('data-testid="image-placeholder"');
    expect(html).toContain('data-slot="Machine – 1200×900"');
  });

  it("renders key specs as a description list", () => {
    const html = render("kubota-kx057-4");
    expect(html).toMatch(/<dl[^>]*>[\s\S]*Operating weight[\s\S]*5,700 kg[\s\S]*<\/dl>/);
    expect(html).toContain("32.8 kW (44 HP)");
    expect(html).toContain("0.18 m³");
  });

  it("shows the from price", () => {
    const html = render("kubota-kx057-4");
    expect(html).toMatch(/data-testid="machine-card-price"[^>]*>from PLN 580 \/ day</);
  });

  it("shows the availability badge", () => {
    expect(render("kubota-kx057-4")).toContain(">Available<");
    expect(render("cat-320-gc")).toContain(">Currently rented<");
  });

  it("links to the machine page", () => {
    const html = render("kubota-kx057-4");
    expect(html).toMatch(
      /<a [^>]*data-testid="machine-card-link"[^>]*href="\/fleet\/kubota-kx057-4"/,
    );
    expect(html).toContain(">Details<");
  });
});
