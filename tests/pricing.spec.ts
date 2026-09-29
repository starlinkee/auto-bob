import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { CATEGORIES } from "../lib/fleet";
import { getMachines } from "../lib/machines";
import { getPricingNotes } from "../lib/pricing-notes";
import { TIER_COLUMNS, estimate, formatMoney, tierFor, withVat } from "../lib/pricing";

const machines = getMachines();
const COLUMN_DAYS = [1, 2, 4, 8, 31];
const withOperator = machines.find((m) => m.pricing.extras.operatorPerDay !== null)!;
const withoutOperator = machines.find((m) => m.pricing.extras.operatorPerDay === null);
const [first, second] = machines.filter((m) => m.pricing.extras.operatorPerDay !== null);

async function fillEstimator(page: Page, days: string, km: string, operator: boolean) {
  await page.locator("#est-days").fill(days);
  await page.locator("#est-delivery-km").fill(km);
  const box = page.locator("#est-operator");
  if ((await box.isChecked()) !== operator) await box.setChecked(operator);
}

test.describe("pricing", () => {
  test("lists every machine under its category with tier prices", async ({ page }) => {
    const res = await page.goto("/pricing");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Prices");
    const present = CATEGORIES.filter((c) => machines.some((m) => m.category === c.id));
    await expect(page.locator('section[id^="pricing-"]:has(table) h2')).toHaveText(
      present.map((c) => c.plural),
    );
    await expect(page.locator("section table thead").first()).toContainText("Machine");
    await expect(page.locator("section table thead th").nth(1)).toHaveText(TIER_COLUMNS[0]);
    await expect(page.locator("section table tbody tr")).toHaveCount(machines.length);
    for (const m of machines) {
      const row = page.locator(`#pricing-${m.category} tr[data-slug="${m.slug}"]`);
      await expect(row).toHaveCount(1);
      await expect(row.locator("a")).toHaveAttribute("href", `/fleet/${m.slug}`);
      await expect(row.locator("td")).toHaveText(
        COLUMN_DAYS.map((d) => formatMoney(tierFor(m.pricing, d).perDay, m.pricing.currency)),
      );
    }
    await expectNoA11yViolations(page);
  });

  test("VAT toggle switches between net and gross", async ({ page }) => {
    await page.goto("/pricing");
    const toggle = page.locator("#vat-toggle");
    await expect(toggle).toHaveAttribute("role", "radiogroup");
    await expect(toggle.getByRole("radio")).toHaveText(["Net", "Gross (incl. VAT)"]);
    await expect(toggle.getByRole("radio", { name: "Net" })).toBeChecked();
    await expect(page.locator("#vat-caption")).toContainText("net");

    await toggle.getByRole("radio", { name: "Gross (incl. VAT)" }).click();
    await expect(page.locator("#vat-caption")).toContainText("gross");
    for (const m of machines) {
      await expect(page.locator(`tr[data-slug="${m.slug}"] td`)).toHaveText(
        COLUMN_DAYS.map((d) =>
          formatMoney(withVat(tierFor(m.pricing, d).perDay, m.pricing.vatRate), m.pricing.currency),
        ),
      );
    }
    await expectNoA11yViolations(page);

    await toggle.getByRole("radio", { name: "Net" }).click();
    for (const m of machines) {
      await expect(page.locator(`tr[data-slug="${m.slug}"] td`)).toHaveText(
        COLUMN_DAYS.map((d) => formatMoney(tierFor(m.pricing, d).perDay, m.pricing.currency)),
      );
    }
  });

  test("estimator outputs match estimate()", async ({ page }) => {
    await page.goto("/pricing");
    const inputs = [
      { days: 1, km: 0, operator: false },
      { days: 5, km: 20, operator: true },
      { days: 31, km: 0, operator: false },
    ];
    for (const m of [first!, second ?? withOperator]) {
      await page.locator("#est-machine").selectOption(m.slug);
      for (const input of inputs) {
        await fillEstimator(page, String(input.days), String(input.km), input.operator);
        const e = estimate(m.pricing, {
          days: input.days,
          operator: input.operator,
          deliveryKm: input.km,
        });
        const money = (n: number) => formatMoney(n, m.pricing.currency);
        await expect(page.locator("#est-per-day")).toHaveText(money(e.perDay));
        await expect(page.locator("#est-rental")).toHaveText(money(e.rental));
        await expect(page.locator("#est-operator-cost")).toHaveText(money(e.operator));
        await expect(page.locator("#est-delivery-cost")).toHaveText(money(e.delivery));
        await expect(page.locator("#est-net")).toHaveText(money(e.net));
        await expect(page.locator("#est-vat")).toHaveText(money(e.vat));
        await expect(page.locator("#est-gross")).toHaveText(money(e.gross));
      }
    }
  });

  test("estimator validates input and operator availability", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("#est-days")).toHaveValue("7");
    await expect(page.locator("#est-delivery-km")).toHaveValue("0");
    for (const bad of ["0", "400"]) {
      await page.locator("#est-days").fill(bad);
      await expect(page.locator("#est-error")).toBeVisible();
      await expect(page.locator("#est-net")).toHaveCount(0);
    }
    await page.locator("#est-days").fill("7");
    await expect(page.locator("#est-error")).toHaveCount(0);
    await expect(page.locator("#est-net")).toBeVisible();

    if (withoutOperator) {
      await page.locator("#est-machine").selectOption(withoutOperator.slug);
      await expect(page.locator("#est-operator")).toBeDisabled();
    }
    await page.locator("#est-machine").selectOption(withOperator.slug);
    await expect(page.locator("#est-operator")).toBeEnabled();
    await expectNoA11yViolations(page);
  });

  test("quote link and terms follow the selected machine", async ({ page }) => {
    await page.goto("/pricing");
    const groups = page.locator("#est-machine optgroup");
    await expect(groups).toHaveCount(new Set(machines.map((m) => m.category)).size);
    const notes = getPricingNotes();
    for (const m of [first!, second ?? withOperator]) {
      await page.locator("#est-machine").selectOption(m.slug);
      await page.locator("#est-days").fill("12");
      await expect(page.locator("#est-quote")).toHaveAttribute(
        "href",
        `/contact?machine=${m.slug}&days=12`,
      );
      const terms = page.locator("#pricing-notes");
      await expect(terms).toContainText(formatMoney(m.pricing.deposit, m.pricing.currency));
      await expect(terms).toContainText(
        formatMoney(m.pricing.extras.extraHour, m.pricing.currency),
      );
      await expect(terms).toContainText(`${notes.workingHoursPerDay} h`);
    }
    await expect(page.getByText("indicative", { exact: false })).toBeVisible();
  });

  test("sticky CTA is visible on a phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto("/pricing");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const cta = page.locator("#pricing-sticky-cta");
    await expect(cta).toBeInViewport();
    await expect(cta.getByRole("link", { name: "Request a quote" })).toHaveAttribute(
      "href",
      "/contact",
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expectNoA11yViolations(page);
  });

  test("CTA sits in the side column on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pricing");
    const cta = page.locator("#pricing-sticky-cta");
    await expect(cta).toBeVisible();
    const position = await cta.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });
});
