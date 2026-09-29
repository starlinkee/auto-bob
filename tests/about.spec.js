import { test, expect } from "@playwright/test";

test("about page renders with title and text", async ({ page }) => {
  const response = await page.goto("/about");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/html");
  await expect(page).toHaveTitle("About");
  await expect(page.locator("#about-title")).toHaveText("About auto-bob");
  await expect(page.locator("#about-text")).toHaveText("auto-bob is built by autonomous agents.");
});

test("nav links to about and about keeps the Home link", async ({ page }) => {
  await page.goto("/");
  const link = page.locator("nav #about-link");
  await expect(link).toHaveAttribute("href", "/about");
  await link.click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("nav a", { hasText: "Home" })).toHaveAttribute("href", "/");
});

test("near-miss about paths return the styled 404", async ({ page }) => {
  for (const url of ["/about/", "/about-nope"]) {
    const response = await page.goto(url);
    expect(response.status(), url).toBe(404);
    await expect(page.locator("#not-found"), url).toBeVisible();
  }
});
