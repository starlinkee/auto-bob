import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { getSite, telHref } from "../lib/site";

const site = getSite();

test.describe("page shell", () => {
  test("home renders with the header links", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-type"]).toContain("text/html");
    await expect(page).toHaveTitle(new RegExp(site.name));
    const hrefs = {
      "#nav-home": "/",
      "#nav-fleet": "/fleet",
      "#nav-pricing": "/pricing",
      "#nav-gallery": "/gallery",
      "#nav-about": "/about",
      "#nav-contact": "/contact",
      "#header-quote": "/contact",
    };
    for (const [selector, href] of Object.entries(hrefs)) {
      await expect(page.locator(`header ${selector}`)).toHaveAttribute("href", href);
    }
    await expect(page.locator("header #header-phone")).toHaveAttribute("href", telHref(site.phone));
    await expect(page.locator("header")).toHaveCSS("position", "sticky");
  });

  test("mobile nav collapses behind the toggle", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const toggle = page.locator("#nav-toggle");
    await expect(page.locator("#nav-fleet")).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#nav-fleet")).toBeVisible();
    await expect(page.locator("#nav-contact")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#nav-fleet")).toBeHidden();
  });

  test("desktop nav is visible without the toggle", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator("#nav-toggle")).toBeHidden();
    for (const id of ["fleet", "pricing", "gallery", "about", "contact"]) {
      await expect(page.locator(`#nav-${id}`)).toBeVisible();
    }
  });

  for (const width of [360, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  }

  test("skip link is first in the tab order and focuses main", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator("#skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("footer shows contact data, legal links and a lazy map", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toContainText(site.address.street);
    await expect(footer).toContainText(site.address.city);
    for (const entry of site.hours) {
      await expect(footer).toContainText(entry.days);
      await expect(footer).toContainText(entry.open);
    }
    await expect(footer.locator('a[href="/privacy"]')).toBeVisible();
    await expect(footer.locator('a[href="/terms"]')).toBeVisible();
    await expect(footer.locator('a[href^="tel:"]')).toHaveAttribute("href", telHref(site.phone));
    await expect(footer.locator('a[href^="mailto:"]')).toHaveAttribute(
      "href",
      `mailto:${site.email}`,
    );
    const map = page.locator("#footer-map iframe");
    await expect(map).toHaveAttribute("loading", "lazy");
    expect(((await map.getAttribute("title")) ?? "").length).toBeGreaterThan(0);
    const src = (await map.getAttribute("src")) ?? "";
    expect(src).toContain(String(site.geo.lat));
    expect(src).toContain(String(site.geo.lng));
  });

  test("home shows the hero image placeholder", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1#home-title")).toHaveText(site.name);
    await expect(page.locator('[data-testid="image-placeholder"]')).toContainText(
      "Hero – 1920×900",
    );
  });

  test("unknown routes return the 404 page", async ({ page }) => {
    const res = await page.goto("/nope");
    expect(res?.status()).toBe(404);
    await expect(page.locator("#not-found")).toHaveText("Page not found");
    await expect(page.locator("header #nav-fleet")).toHaveAttribute("href", "/fleet");
  });

  test("responses carry the security headers", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain(
      "frame-src https://www.google.com https://maps.google.com",
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("home has no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expectNoA11yViolations(page);
  });

  test("404 page has no accessibility violations", async ({ page }) => {
    await page.goto("/nope");
    await expectNoA11yViolations(page);
  });
});
