import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("iframe")
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}
