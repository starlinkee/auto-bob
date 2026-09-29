import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { getAbout } from "../lib/about";
import { getSite } from "../lib/site";

const site = getSite();
const about = getAbout();

const pages = [
  { path: "/about", h1: `About ${site.name}` },
  { path: "/privacy", h1: "Privacy policy" },
  { path: "/terms", h1: "Terms of rental" },
];

for (const { path, h1 } of pages) {
  test.describe(path, () => {
    test("renders one h1 and a canonical link", async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(h1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${path}$`),
      );
    });

    test("has no accessibility violations", async ({ page }) => {
      await page.goto(path);
      await expectNoA11yViolations(page);
    });
  });
}

test("about shows every section, certification and image slot", async ({ page }) => {
  await page.goto("/about");
  for (const id of [
    "about-story",
    "about-mission",
    "about-safety",
    "about-certifications",
    "about-team",
    "about-depot",
    "about-cta",
  ]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  const items = page.locator("#about-certifications li");
  await expect(items).toHaveCount(about.certifications.length);
  for (const cert of about.certifications) {
    await expect(page.locator("#about-certifications")).toContainText(cert.name);
  }
  await expect(page.locator('#about-team [data-slot="Team – 1200×800"]')).toBeVisible();
  await expect(page.locator('#about-depot [data-slot="Depot – 1200×800"]')).toBeVisible();
  await expect(page.locator("#about-cta a[href='/contact']")).toBeVisible();
});

test("privacy names the company and states data is not stored", async ({ page }) => {
  await page.goto("/privacy");
  const main = page.locator("main");
  await expect(main).toContainText(site.name);
  await expect(main).toContainText(site.email);
  await expect(main).toContainText("not stored");
  await expect(page.locator("#legal-updated")).toContainText("Last updated");
});

test("terms show the last-updated date and link to pricing", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.locator("#legal-updated")).toContainText("Last updated");
  await expect(page.locator("main a[href='/pricing']")).toBeVisible();
});

test("footer legal links lead to the legal pages", async ({ page }) => {
  await page.goto("/about");
  await page.locator("#footer-legal a[href='/privacy']").click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator("h1")).toHaveText("Privacy policy");
  await page.locator("#footer-legal a[href='/terms']").click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.locator("h1")).toHaveText("Terms of rental");
});
