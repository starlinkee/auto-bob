import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { expectNoA11yViolations } from "./helpers/a11y";
import { getMachines } from "../lib/machines";
import { directionsUrl, getSite, telHref } from "../lib/site";

const site = getSite();
const machines = getMachines();
const businessEmail = process.env.CONTACT_TO_EMAIL || site.email;

type OutboxMessage = { to: string; from: string; replyTo?: string; subject: string; text: string };

async function outbox(request: APIRequestContext, to: string): Promise<OutboxMessage[]> {
  const response = await request.get(`/api/test/outbox?to=${encodeURIComponent(to)}`);
  return ((await response.json()) as { messages: OutboxMessage[] }).messages;
}

function unique() {
  const id = randomUUID().slice(0, 8);
  return { clientId: `client-${id}`, email: `customer-${id}@example.com`, id };
}

function validBody(email: string, extra: Record<string, unknown> = {}) {
  return {
    name: "Jan Kowalski",
    email,
    phone: "+48 600 111 222",
    machines: [],
    delivery: false,
    operator: false,
    message: "I need a machine for two weeks.",
    consent: true,
    ...extra,
  };
}

test.describe("contact page", () => {
  test("shows the contact details and the map", async ({ page }) => {
    const res = await page.goto("/contact");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Contact us");
    await expect(page.locator("#contact-phone-link")).toHaveAttribute("href", telHref(site.phone));
    await expect(page.locator("#contact-email-link")).toHaveAttribute(
      "href",
      `mailto:${site.email}`,
    );
    for (const entry of site.hours) {
      await expect(page.locator("#contact-hours")).toContainText(entry.days);
      await expect(page.locator("#contact-hours")).toContainText(entry.open);
    }
    await expect(page.locator("#contact-address")).toContainText(site.address.street);
    await expect(page.locator("#contact-service-area")).toContainText(site.serviceArea);
    const directions = page.locator("#contact-directions");
    await expect(directions).toHaveAttribute("href", directionsUrl(site));
    await expect(directions).toHaveAttribute("target", "_blank");
    const src = await page.locator("#contact-map iframe").getAttribute("src");
    expect(src).toContain(`${site.geo.lat},${site.geo.lng}`);
    await expectNoA11yViolations(page);
  });

  test("pre-selects machines and days from the query string", async ({ page }) => {
    const [first, second] = machines;
    await page.goto(
      `/contact?machine=${first.slug}&machine=${second.slug}&machine=no-such-machine&days=5`,
    );
    await expect(page.locator(`#contact-machines input[value="${first.slug}"]`)).toBeChecked();
    await expect(page.locator(`#contact-machines input[value="${second.slug}"]`)).toBeChecked();
    await expect(page.locator("#contact-machines input:checked")).toHaveCount(2);
    await expect(page.locator("#contact-days")).toHaveValue("5");
  });

  test("ignores an invalid days parameter", async ({ page }) => {
    await page.goto("/contact?days=abc");
    await expect(page.locator("#contact-days")).toHaveValue("");
  });

  test("submits a valid request and sends both e-mails", async ({ page, request }) => {
    const { clientId, email } = unique();
    await page.setExtraHTTPHeaders({ "x-test-client-id": clientId });
    const machine = machines[0];
    await page.goto("/contact");
    await page.fill("#contact-name", "Anna Nowak");
    await page.fill("#contact-email", email);
    await page.fill("#contact-phone", "+48 600 333 444");
    await page.check(`#contact-machines input[value="${machine.slug}"]`);
    await page.fill("#contact-message", `Please quote ${email} for a long rental.`);
    await page.check("#contact-consent");
    await page.click("#contact-submit");
    await expect(page.locator("#contact-success")).toBeVisible();
    await expect(page.locator("#contact-success")).toHaveAttribute("role", "status");
    await expect(page.locator("#contact-name")).toHaveValue("");

    const toBusiness = (await outbox(request, businessEmail)).filter((m) => m.text.includes(email));
    expect(toBusiness).toHaveLength(1);
    expect(toBusiness[0].replyTo).toBe(email);
    expect(toBusiness[0].text).toContain("Anna Nowak");
    expect(toBusiness[0].text).toContain("+48 600 333 444");
    expect(toBusiness[0].text).toContain(`Please quote ${email}`);
    expect(toBusiness[0].text).toContain(machine.name);
    expect(toBusiness[0].text).not.toContain(machine.slug);

    const autoReply = await outbox(request, email);
    expect(autoReply).toHaveLength(1);
    expect(autoReply[0].text).toContain("within one business day");
    expect(autoReply[0].text).toContain(site.phone);
  });

  test("shows validation errors, focuses the first invalid field and sends nothing", async ({
    page,
  }) => {
    const { clientId } = unique();
    await page.setExtraHTTPHeaders({ "x-test-client-id": clientId });
    let posted = false;
    await page.route("**/api/contact", (route) => {
      posted = true;
      return route.abort();
    });
    await page.goto("/contact");
    await page.click("#contact-submit");
    for (const field of ["name", "email", "phone", "message", "consent"]) {
      await expect(page.locator(`#contact-${field}-error`)).toBeVisible();
      await expect(page.locator(`#contact-${field}`)).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator(`#contact-${field}`)).toHaveAttribute(
        "aria-describedby",
        `contact-${field}-error`,
      );
    }
    await expect(page.locator("#contact-name")).toBeFocused();
    expect(posted).toBe(false);
    await expectNoA11yViolations(page);
  });

  test("delivery reveals a required location field", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("#contact-location")).toHaveCount(0);
    await page.check("#contact-delivery");
    await expect(page.locator("#contact-location")).toBeVisible();
    await page.fill("#contact-name", "Anna Nowak");
    await page.fill("#contact-email", "anna@example.com");
    await page.fill("#contact-phone", "+48 600 333 444");
    await page.fill("#contact-message", "A message that is long enough.");
    await page.check("#contact-consent");
    await page.click("#contact-submit");
    await expect(page.locator("#contact-location-error")).toBeVisible();
    await expect(page.locator("#contact-location")).toBeFocused();
  });

  test("disables the button while sending and keeps input after a failure", async ({ page }) => {
    const { clientId, email } = unique();
    await page.setExtraHTTPHeaders({ "x-test-client-id": clientId });
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/contact", async (route) => {
      await gate;
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "send_failed" }),
      });
    });
    await page.goto("/contact");
    await page.fill("#contact-name", "Anna Nowak");
    await page.fill("#contact-email", email);
    await page.fill("#contact-phone", "+48 600 333 444");
    await page.fill("#contact-message", "A message that is long enough.");
    await page.check("#contact-consent");
    await page.click("#contact-submit");
    await expect(page.locator("#contact-submit")).toBeDisabled();
    await expect(page.locator("#contact-submit")).toHaveText("Sending…");
    release();
    await expect(page.locator("#contact-error")).toBeVisible();
    await expect(page.locator("#contact-error")).toHaveAttribute("role", "alert");
    await expect(page.locator("#contact-email")).toHaveValue(email);
    await expect(page.locator("#contact-submit")).toBeEnabled();
  });
});

test.describe("/api/contact", () => {
  test("rejects form-encoded bodies with 415", async ({ request }) => {
    const { clientId } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId },
      form: { name: "x" },
    });
    expect(res.status()).toBe(415);
  });

  test("rejects a 25 kB body with 413", async ({ request }) => {
    const { clientId, email } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId },
      data: validBody(email, { message: "x".repeat(25 * 1024) }),
    });
    expect(res.status()).toBe(413);
  });

  test("rejects invalid JSON with 400", async ({ request }) => {
    const { clientId } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId, "content-type": "application/json" },
      data: Buffer.from("{not json"),
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_json" });
  });

  test("rejects a bad e-mail with fieldErrors.email", async ({ request }) => {
    const { clientId } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId },
      data: validBody("not-an-email"),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation");
    expect(body.fieldErrors.email).toBeTruthy();
  });

  test("rejects an unknown machine slug", async ({ request }) => {
    const { clientId, email } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId },
      data: validBody(email, { machines: ["no-such-machine"] }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).fieldErrors.machines).toBeTruthy();
  });

  test("requires a location when delivery is requested", async ({ request }) => {
    const { clientId, email } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId },
      data: validBody(email, { delivery: true }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).fieldErrors.location).toBeTruthy();
  });

  test("silently drops a filled honeypot", async ({ request }) => {
    const { clientId, email } = unique();
    const res = await request.post("/api/contact", {
      headers: { "x-test-client-id": clientId },
      data: validBody(email, { website: "https://spam.example" }),
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await outbox(request, email)).toEqual([]);
  });

  test("rejects GET with 405", async ({ request }) => {
    const res = await request.get("/api/contact");
    expect(res.status()).toBe(405);
  });

  test("rate limits per client id", async ({ request }) => {
    const first = unique();
    const other = unique();
    for (let i = 1; i <= 5; i++) {
      const res = await request.post("/api/contact", {
        headers: { "x-test-client-id": first.clientId },
        data: validBody(first.email),
      });
      expect(res.status(), `request ${i}`).toBe(200);
    }
    const limited = await request.post("/api/contact", {
      headers: { "x-test-client-id": first.clientId },
      data: validBody(first.email),
    });
    expect(limited.status()).toBe(429);
    expect(limited.headers()["retry-after"]).toBeTruthy();
    expect(await limited.json()).toEqual({ error: "rate_limited" });

    const fresh = await request.post("/api/contact", {
      headers: { "x-test-client-id": other.clientId },
      data: validBody(other.email),
    });
    expect(fresh.status()).toBe(200);
  });
});
