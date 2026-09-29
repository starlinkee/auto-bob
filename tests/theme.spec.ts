import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";

const theme = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const bodyBg = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("theme toggle", () => {
  test.use({ colorScheme: "dark" });

  test("first visit is light even when the browser prefers dark", async ({ page }) => {
    await page.goto("/");
    expect(await theme(page)).toBe("light");
    await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-pressed", "false");
  });

  test("toggle switches to dark, persists after reload, and back to light", async ({ page }) => {
    await page.goto("/");
    const lightBg = await bodyBg(page);
    const toggle = page.locator("#theme-toggle");
    await expect(toggle).toHaveAccessibleName("Dark mode");

    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await bodyBg(page)).not.toBe(lightBg);

    await page.reload({ waitUntil: "domcontentloaded" });
    expect(await theme(page)).toBe("dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await page.reload({ waitUntil: "domcontentloaded" });
    expect(await theme(page)).toBe("light");
  });

  test("works when localStorage throws", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    await page.goto("/");
    const toggle = page.locator("#theme-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("no accessibility violations in both themes", async ({ page }) => {
    await page.goto("/");
    await expectNoA11yViolations(page);
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expectNoA11yViolations(page);
  });
});
