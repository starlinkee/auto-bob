import { test as base, expect } from "@playwright/test";

const EMPTY_HTML = "<!doctype html><html><head><title>stub</title></head><body></body></html>";

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route(
      /^https?:\/\/([^/]+\.)?(google\.com|googleapis\.com|gstatic\.com)(\/|$|:)/,
      (route) => route.fulfill({ status: 200, contentType: "text/html", body: EMPTY_HTML }),
    );
    await provide(page);
  },
});

export { expect };
