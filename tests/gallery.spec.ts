import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { GALLERY_CATEGORIES, getGallery } from "../lib/gallery";

const items = getGallery();

function swipe(page: Page, dx: number) {
  return page.evaluate((delta) => {
    const dialog = document.querySelector("#lightbox")!;
    const fire = (type: string, clientX: number) =>
      dialog.dispatchEvent(
        new PointerEvent(type, { pointerType: "touch", clientX, clientY: 200, bubbles: true }),
      );
    fire("pointerdown", 300);
    fire("pointerup", 300 + delta);
  }, dx);
}

test.describe("gallery", () => {
  test("lists every item with a placeholder", async ({ page }) => {
    const res = await page.goto("/gallery");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Gallery");
    await expect(page.getByTestId("gallery-item")).toHaveCount(items.length);
    await expect(
      page.locator(
        '#gallery-grid [data-testid="image-placeholder"][data-slot="Gallery – 1600×1067"]',
      ),
    ).toHaveCount(items.length);
    await expect(page.getByTestId("gallery-item").first()).toHaveAccessibleName(items[0]!.caption);
    await expectNoA11yViolations(page);
  });

  test("category tabs filter the grid", async ({ page }) => {
    await page.goto("/gallery");
    const tabs = page.locator('#gallery-tabs [role="tab"]');
    await expect(tabs).toHaveText(["All", ...GALLERY_CATEGORIES.map((c) => c.label)]);
    for (const category of GALLERY_CATEGORIES) {
      await tabs.filter({ hasText: category.label }).click();
      await expect(page.locator(`#gallery-tabs [role="tab"][aria-selected="true"]`)).toHaveText(
        category.label,
      );
      const expected = items.filter((i) => i.category === category.id).length;
      await expect(page.getByTestId("gallery-item")).toHaveCount(expected);
      await expect(
        page.locator(`[data-testid="gallery-item"]:not([data-category="${category.id}"])`),
      ).toHaveCount(0);
    }
    await tabs.first().click();
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("gallery-item")).toHaveCount(items.length);
  });

  test("arrow keys move between tabs", async ({ page }) => {
    await page.goto("/gallery");
    const tabs = page.locator('#gallery-tabs [role="tab"]');
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.last()).toBeFocused();
  });

  test("masonry uses 1, 2 and 3 columns", async ({ page }) => {
    for (const [width, columns] of [
      [500, 1],
      [800, 2],
      [1280, 3],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/gallery");
      const count = await page
        .locator("#gallery-grid")
        .evaluate((el) => getComputedStyle(el).columnCount);
      expect(count).toBe(String(columns));
    }
  });

  test("lightbox opens, navigates with keys and buttons, wraps and closes", async ({ page }) => {
    await page.goto("/gallery");
    const n = items.length;
    const opener = page.getByTestId("gallery-item").nth(2);
    await opener.click();
    const dialog = page.locator("#lightbox");
    await expect(dialog).toHaveAttribute("role", "dialog");
    await expect(page.locator("#lightbox-counter")).toHaveText(`3 / ${n}`);
    await expect(page.locator("#lightbox-caption")).toHaveText(items[2]!.caption);
    expect(
      await page.evaluate(() =>
        document.getElementById("lightbox")!.contains(document.activeElement),
      ),
    ).toBe(true);

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#lightbox-counter")).toHaveText(`4 / ${n}`);
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#lightbox-counter")).toHaveText(`3 / ${n}`);
    await page.locator("#lightbox-next").click();
    await expect(page.locator("#lightbox-counter")).toHaveText(`4 / ${n}`);
    await page.locator("#lightbox-prev").click();
    await expect(page.locator("#lightbox-counter")).toHaveText(`3 / ${n}`);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#lightbox-counter")).toHaveText(`1 / ${n}`);
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#lightbox-counter")).toHaveText(`${n} / ${n}`);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#lightbox-counter")).toHaveText(`1 / ${n}`);

    await expectNoA11yViolations(page);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() =>
          document.getElementById("lightbox")!.contains(document.activeElement),
        ),
      ).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(
        await page.evaluate(() =>
          document.getElementById("lightbox")!.contains(document.activeElement),
        ),
      ).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  });

  test("touch swipe changes the image, a short move does not", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByTestId("gallery-item").nth(2).click();
    await expect(page.locator("#lightbox-counter")).toHaveText(`3 / ${items.length}`);
    await swipe(page, -20);
    await expect(page.locator("#lightbox-counter")).toHaveText(`3 / ${items.length}`);
    await swipe(page, -120);
    await expect(page.locator("#lightbox-counter")).toHaveText(`4 / ${items.length}`);
    await swipe(page, 120);
    await expect(page.locator("#lightbox-counter")).toHaveText(`3 / ${items.length}`);
  });

  test("lightbox counts only the filtered items", async ({ page }) => {
    await page.goto("/gallery");
    const category = GALLERY_CATEGORIES[1];
    const filtered = items.filter((i) => i.category === category.id);
    await page.locator('#gallery-tabs [role="tab"]').filter({ hasText: category.label }).click();
    await page.getByTestId("gallery-item").nth(1).click();
    await expect(page.locator("#lightbox-counter")).toHaveText(`2 / ${filtered.length}`);
    await expect(page.locator("#lightbox-caption")).toHaveText(filtered[1]!.caption);
    await page.locator("#lightbox-close").click();
    await expect(page.locator("#lightbox")).toHaveCount(0);
  });
});
