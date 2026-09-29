import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { CATEGORIES, capacityValue, enginePowerKw, operatingWeightKg } from "../lib/fleet";
import { fromPrice } from "../lib/pricing";
import { getMachines } from "../lib/machines";

const machines = getMachines();
const names = (list: typeof machines) => list.map((m) => m.name);

const WEIGHT: Record<string, (kg: number) => boolean> = {
  "lt-3t": (kg) => kg < 3000,
  "3-10t": (kg) => kg >= 3000 && kg < 10000,
  "10-20t": (kg) => kg >= 10000 && kg < 20000,
  "gt-20t": (kg) => kg >= 20000,
};
const POWER: Record<string, (kw: number) => boolean> = {
  "lt-25kw": (kw) => kw < 25,
  "25-75kw": (kw) => kw >= 25 && kw <= 75,
  "gt-75kw": (kw) => kw > 75,
};

function cardNames(page: Page) {
  return page.getByTestId("machine-card").locator("h3");
}

async function expectCards(page: Page, expected: typeof machines) {
  await expect(page.locator("#fleet-count")).toHaveText(
    `${expected.length} ${expected.length === 1 ? "machine" : "machines"}`,
  );
  await expect(cardNames(page)).toHaveText(names(expected));
}

test.describe("fleet catalogue", () => {
  test("lists every machine in name order", async ({ page }) => {
    const res = await page.goto("/fleet");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Our fleet");
    await expectCards(page, machines);
    await expect(page.getByTestId("machine-card")).toHaveCount(machines.length);
    await expectNoA11yViolations(page);
  });

  test("category select filters and sets the URL", async ({ page }) => {
    await page.goto("/fleet");
    for (const category of CATEGORIES) {
      const expected = machines.filter((m) => m.category === category.id);
      await page.locator("#fleet-category").selectOption(category.id);
      await expect(page).toHaveURL(new RegExp(`[?&]category=${category.id}(&|$)`));
      await expectCards(page, expected);
    }
    await page.locator("#fleet-category").selectOption("");
    await expect(page).not.toHaveURL(/category=/);
    await expectCards(page, machines);
  });

  test("category URL preselects the select", async ({ page }) => {
    for (const category of CATEGORIES) {
      await page.goto(`/fleet?category=${category.id}`);
      await expect(page.locator("#fleet-category")).toHaveValue(category.id);
      await expectCards(
        page,
        machines.filter((m) => m.category === category.id),
      );
    }
  });

  test("search matches manufacturer case-insensitively", async ({ page }) => {
    const manufacturer = machines[0]!.manufacturer;
    await page.goto("/fleet");
    await page.locator("#fleet-search").fill(manufacturer.toUpperCase());
    await expect(page).toHaveURL(new RegExp(`[?&]q=`));
    await expectCards(
      page,
      machines.filter((m) =>
        [m.name, m.manufacturer, m.model].some((v) =>
          v.toLowerCase().includes(manufacturer.toLowerCase()),
        ),
      ),
    );
  });

  test("weight and power classes filter", async ({ page }) => {
    await page.goto("/fleet");
    for (const [id, test_] of Object.entries(WEIGHT)) {
      await page.locator("#fleet-weight").selectOption(id);
      await expect(page).toHaveURL(new RegExp(`weight=${id}`));
      await expectCards(
        page,
        machines.filter((m) => {
          const v = operatingWeightKg(m);
          return v !== null && test_(v);
        }),
      );
    }
    await page.locator("#fleet-weight").selectOption("");
    for (const [id, test_] of Object.entries(POWER)) {
      await page.locator("#fleet-power").selectOption(id);
      await expect(page).toHaveURL(new RegExp(`power=${id}`));
      await expectCards(
        page,
        machines.filter((m) => {
          const v = enginePowerKw(m);
          return v !== null && test_(v);
        }),
      );
    }
  });

  test("checkboxes filter and combine", async ({ page }) => {
    await page.goto("/fleet");
    await page.locator("#fleet-available").check();
    await expect(page).toHaveURL(/available=1/);
    await expectCards(
      page,
      machines.filter((m) => m.available),
    );
    await page.locator("#fleet-operator").check();
    await expect(page).toHaveURL(/operator=1/);
    await expectCards(
      page,
      machines.filter((m) => m.available && m.operatorAvailable),
    );
    await page.locator("#fleet-weight").selectOption("3-10t");
    await expectCards(
      page,
      machines.filter((m) => {
        const kg = operatingWeightKg(m);
        return m.available && m.operatorAvailable && kg !== null && WEIGHT["3-10t"]!(kg);
      }),
    );
  });

  test("sorting by price and capacity", async ({ page }) => {
    await page.goto("/fleet");
    const byName = (a: (typeof machines)[number], b: (typeof machines)[number]) =>
      a.name.localeCompare(b.name, "en");
    await page.locator("#fleet-sort").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    await expectCards(
      page,
      [...machines].sort((a, b) => fromPrice(a.pricing) - fromPrice(b.pricing) || byName(a, b)),
    );
    await page.locator("#fleet-sort").selectOption("price-desc");
    await expectCards(
      page,
      [...machines].sort((a, b) => fromPrice(b.pricing) - fromPrice(a.pricing) || byName(a, b)),
    );
    await page.locator("#fleet-sort").selectOption("capacity-desc");
    await expectCards(
      page,
      [...machines].sort((a, b) => {
        const ca = capacityValue(a);
        const cb = capacityValue(b);
        if (ca === null || cb === null) return ca === cb ? byName(a, b) : ca === null ? 1 : -1;
        return cb - ca || byName(a, b);
      }),
    );
    await page.locator("#fleet-sort").selectOption("name");
    await expect(page).not.toHaveURL(/sort=/);
  });

  test("empty state and reset", async ({ page }) => {
    await page.goto("/fleet");
    await page.locator("#fleet-search").fill("zzz-no-such-machine");
    await expect(page.locator("#fleet-empty")).toBeVisible();
    await expect(page.locator("#fleet-count")).toHaveText("0 machines");
    await expectNoA11yViolations(page);
    await page.locator("#fleet-reset").click();
    await expectCards(page, machines);
    await expect(page.locator("#fleet-search")).toHaveValue("");
    expect(new URL(page.url()).search).toBe("");
  });

  test("URL with several parameters restores every control", async ({ page }) => {
    const m = machines.find((x) => x.available && x.operatorAvailable) ?? machines[0]!;
    const url = `/fleet?category=${m.category}&available=1&operator=1&sort=price-desc&q=${encodeURIComponent(m.manufacturer)}`;
    await page.goto(url);
    await expect(page.locator("#fleet-category")).toHaveValue(m.category);
    await expect(page.locator("#fleet-available")).toBeChecked();
    await expect(page.locator("#fleet-operator")).toBeChecked();
    await expect(page.locator("#fleet-sort")).toHaveValue("price-desc");
    await expect(page.locator("#fleet-search")).toHaveValue(m.manufacturer);
    const before = await cardNames(page).allTextContents();
    expect(before.length).toBeGreaterThan(0);
    await page.reload();
    expect(await cardNames(page).allTextContents()).toEqual(before);
    await expectNoA11yViolations(page);
  });

  test("unknown parameter values are ignored", async ({ page }) => {
    await page.goto("/fleet?category=bogus&sort=bogus&weight=x&power=y");
    await expectCards(page, machines);
    await expect(page.locator("#fleet-sort")).toHaveValue("name");
  });

  test("card details link points to the machine", async ({ page }) => {
    await page.goto("/fleet");
    const cards = page.getByTestId("machine-card");
    for (let i = 0; i < machines.length; i++) {
      const card = cards.nth(i);
      const slug = await card.getAttribute("data-slug");
      await expect(card.getByTestId("machine-card-link")).toHaveAttribute("href", `/fleet/${slug}`);
    }
  });
});
