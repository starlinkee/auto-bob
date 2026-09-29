import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { getMachines } from "../lib/machines";
import { getSite } from "../lib/site";

const site = getSite();
const STATIC_PATHS = [
  "/",
  "/fleet",
  "/pricing",
  "/gallery",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

test.describe("seo", () => {
  test("sitemap lists every page and machine with absolute URLs", async ({ request, baseURL }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs) expect(loc.startsWith(baseURL!)).toBe(true);
    const paths = locs.map((loc) => new URL(loc).pathname);
    for (const path of STATIC_PATHS) expect(paths).toContain(path);
    const slugs = getMachines().map((m) => m.slug);
    for (const slug of slugs) expect(paths).toContain(`/fleet/${slug}`);
    expect(paths.filter((p) => p.startsWith("/fleet/"))).toHaveLength(slugs.length);
  });

  test("robots.txt allows the site, blocks the API and names the sitemap", async ({
    request,
    baseURL,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^Allow: \/$/m);
    expect(body).toMatch(/^Disallow: \/api\/$/m);
    expect(body).toContain(`Sitemap: ${baseURL}/sitemap.xml`);
  });

  for (const path of ["/", "/nope"]) {
    test(`LocalBusiness JSON-LD is present on ${path}`, async ({ page }) => {
      await page.goto(path);
      const data = JSON.parse((await page.locator("#localbusiness-jsonld").textContent()) ?? "");
      expect(data["@type"]).toBe("LocalBusiness");
      expect(data.name).toBe(site.name);
      expect(data.telephone).toBe(site.phone);
      expect(data.address["@type"]).toBe("PostalAddress");
      expect(data.address.streetAddress).toBe(site.address.street);
      expect(data.address.postalCode).toBe(site.address.postalCode);
      expect(data.address.addressLocality).toBe(site.address.city);
      expect(data.geo["@type"]).toBe("GeoCoordinates");
      expect(data.geo.latitude).toBe(site.geo.lat);
      expect(data.geo.longitude).toBe(site.geo.lng);
      expect(Array.isArray(data.openingHours)).toBe(true);
    });
  }

  test("default Open Graph image is a 1200x630 PNG referenced by the home page", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    const tw = await page.locator('meta[name="twitter:image"]').getAttribute("content");
    expect(og).toContain("/opengraph-image");
    expect(tw).toContain("/twitter-image");
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);

    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const png = await res.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);

    const twitter = await request.get(new URL(tw!).pathname);
    expect(twitter.headers()["content-type"]).toContain("image/png");
    await expectNoA11yViolations(page);
  });
});
