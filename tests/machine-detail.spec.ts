import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { categoryLabel, specRows } from "../lib/fleet";
import { getMachines } from "../lib/machines";
import { formatMoney, fromPrice, rentalTotal, TIER_COLUMNS, withVat } from "../lib/pricing";

const machines = getMachines();
const first = machines[0]!;

test.describe("machine detail", () => {
  test("every machine page renders its name and title", async ({ page }) => {
    for (const machine of machines) {
      const res = await page.goto(`/fleet/${machine.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("#machine-title")).toHaveText(machine.name);
      await expect(page).toHaveTitle(
        new RegExp(`^${machine.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      );
      await expect(page.locator("#machine-category")).toHaveAttribute(
        "href",
        `/fleet?category=${machine.category}`,
      );
      await expect(page.locator("#machine-category")).toHaveText(categoryLabel(machine.category));
    }
  });

  test("unknown slug returns 404", async ({ page }) => {
    const res = await page.goto("/fleet/does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("specifications match specRows", async ({ page }) => {
    for (const machine of machines) {
      await page.goto(`/fleet/${machine.slug}`);
      const rows = specRows(machine);
      await expect(page.locator("#machine-specs tbody tr")).toHaveCount(rows.length);
      await expect(page.locator("#machine-specs th[scope='row']")).toHaveText(
        rows.map((r) => r.label),
      );
      await expect(page.locator("#machine-specs td")).toHaveText(rows.map((r) => r.value));
    }
  });

  test("price table shows every tier and the extras", async ({ page }) => {
    for (const machine of machines) {
      const { pricing } = machine;
      const money = (n: number) => formatMoney(n, pricing.currency);
      await page.goto(`/fleet/${machine.slug}`);
      const rows = page.locator("#machine-prices [data-testid='price-tier']");
      await expect(rows).toHaveCount(pricing.tiers.length);
      for (const [i, tier] of pricing.tiers.entries()) {
        const cells = rows.nth(i).locator("th, td");
        await expect(cells).toHaveText([
          TIER_COLUMNS[i]!,
          money(tier.perDay),
          money(withVat(tier.perDay, pricing.vatRate)),
        ]);
      }
      await expect(page.locator("#price-deposit")).toHaveText(money(pricing.deposit));
      await expect(page.locator("#price-operator")).toHaveText(
        pricing.extras.operatorPerDay === null
          ? "Not available"
          : money(pricing.extras.operatorPerDay),
      );
      await expect(page.locator("#price-delivery")).toHaveText(money(pricing.extras.deliveryPerKm));
      await expect(page.locator("#price-extra-hour")).toHaveText(money(pricing.extras.extraHour));
    }
  });

  test("live estimate and quote link follow the rental days", async ({ page }) => {
    const { pricing, slug } = first;
    const money = (n: number) => formatMoney(n, pricing.currency);
    await page.goto(`/fleet/${slug}`);
    await expect(page.locator("#rental-days")).toHaveValue("1");
    for (const days of [1, 3, 8, 31]) {
      await page.locator("#rental-days").fill(String(days));
      const net = rentalTotal(pricing, days);
      await expect(page.locator("#rental-estimate")).toContainText(money(net));
      await expect(page.locator("#rental-estimate")).toContainText(
        money(withVat(net, pricing.vatRate)),
      );
      await expect(page.locator("#machine-quote")).toHaveAttribute(
        "href",
        `/contact?machine=${slug}&days=${days}`,
      );
    }
    for (const bad of ["0", ""]) {
      await page.locator("#rental-days").fill(bad);
      await expect(page.locator("#rental-days-error")).toBeVisible();
      await expect(page.locator("#rental-estimate")).toHaveCount(0);
    }
  });

  test("thumbnail opens the lightbox at its index and Escape closes it", async ({ page }) => {
    await page.goto(`/fleet/${first.slug}`);
    const thumbs = page.getByTestId("machine-thumb");
    if ((await thumbs.count()) === 0) {
      await page.getByTestId("machine-main-image").click();
      await expect(page.locator("#lightbox-counter")).toHaveText(`1 / ${first.images.length}`);
    } else {
      const last = (await thumbs.count()) - 1;
      await thumbs.nth(last).click();
      await expect(page.locator("#lightbox")).toBeVisible();
      await expect(page.locator("#lightbox-counter")).toHaveText(
        `${last + 1} / ${first.images.length}`,
      );
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("#lightbox")).toHaveCount(0);
  });

  test("availability, operator and spec sheet reflect the data", async ({ page }) => {
    for (const machine of machines) {
      await page.goto(`/fleet/${machine.slug}`);
      await expect(page.locator("#machine-availability")).toHaveText(
        machine.available ? "Available" : "Currently rented",
      );
      if (machine.datasheetUrl) {
        await expect(page.locator("#machine-datasheet a")).toHaveAttribute(
          "href",
          machine.datasheetUrl,
        );
      } else {
        await expect(page.locator("#machine-datasheet")).toHaveText("Spec sheet on request");
        await expect(page.locator("#machine-datasheet a")).toHaveCount(0);
      }
    }
  });

  test("related machines: at most 3, not itself, same category first", async ({ page }) => {
    for (const machine of machines) {
      await page.goto(`/fleet/${machine.slug}`);
      const cards = page.locator("#related-machines [data-testid='machine-card']");
      const slugs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")));
      const others = machines.filter((m) => m.slug !== machine.slug);
      expect(slugs.length).toBe(Math.min(3, others.length));
      expect(slugs).not.toContain(machine.slug);
      const sameCategory = others.filter((m) => m.category === machine.category).map((m) => m.slug);
      const expectedSame = sameCategory.slice(0, 3);
      expect(slugs.slice(0, expectedSame.length)).toEqual(expectedSame);
    }
  });

  test("JSON-LD describes the product", async ({ page }) => {
    for (const machine of machines) {
      await page.goto(`/fleet/${machine.slug}`);
      const json = JSON.parse((await page.locator("#machine-jsonld").textContent()) ?? "");
      expect(json["@type"]).toBe("Product");
      expect(json.name).toBe(machine.name);
      expect(json.offers.price).toBe(fromPrice(machine.pricing));
      expect(json.offers.priceCurrency).toBe(machine.pricing.currency);
      expect(json.offers.availability).toBe(
        machine.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      );
    }
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto(`/fleet/${first.slug}`);
    await expectNoA11yViolations(page);
  });
});
