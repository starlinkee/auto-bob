import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import siteJson from "@/content/site.json";
import { getSite, siteSchema, telHref } from "@/lib/site";
import { SmartImage } from "@/components/SmartImage";

afterEach(() => vi.unstubAllEnvs());

describe("site data", () => {
  it("rejects a site without phone", () => {
    const withoutPhone: Partial<typeof siteJson> = { ...siteJson };
    delete withoutPhone.phone;
    expect(siteSchema.safeParse(withoutPhone).success).toBe(false);
  });

  it("overrides geo from the environment when both values are set", () => {
    vi.stubEnv("NEXT_PUBLIC_BUSINESS_LAT", "50.06");
    vi.stubEnv("NEXT_PUBLIC_BUSINESS_LNG", "19.94");
    expect(getSite().geo).toEqual({ lat: 50.06, lng: 19.94 });
  });

  it("keeps the configured geo when only one value is set", () => {
    vi.stubEnv("NEXT_PUBLIC_BUSINESS_LAT", "50.06");
    vi.stubEnv("NEXT_PUBLIC_BUSINESS_LNG", "");
    expect(getSite().geo).toEqual(siteJson.geo);
  });

  it("builds tel: hrefs", () => {
    expect(telHref("+48 600 100 200")).toBe("tel:+48600100200");
  });
});

describe("SmartImage", () => {
  it("renders the placeholder with the slot label when src is null", () => {
    const html = renderToStaticMarkup(
      createElement(SmartImage, {
        image: { src: null, alt: "" },
        slot: "Machine – 1200×900",
        width: 1200,
        height: 900,
      }),
    );
    expect(html).toContain('data-testid="image-placeholder"');
    expect(html).toContain('data-slot="Machine – 1200×900"');
    expect(html).toContain("Machine – 1200×900</span>");
  });
});
