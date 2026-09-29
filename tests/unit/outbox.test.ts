import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/test/outbox/route";
import { sendMail } from "@/lib/mail";

afterEach(() => vi.unstubAllEnvs());

describe("/api/test/outbox", () => {
  it("returns 404 unless ENABLE_TEST_ENDPOINTS=1", async () => {
    vi.stubEnv("ENABLE_TEST_ENDPOINTS", "");
    const response = GET(new Request("http://localhost/api/test/outbox?to=a@example.com"));
    expect(response.status).toBe(404);
  });

  it("returns only the messages for the recipient, oldest first", async () => {
    vi.stubEnv("ENABLE_TEST_ENDPOINTS", "1");
    vi.stubEnv("RESEND_API_KEY", "");
    const base = { from: "x@example.com", text: "body" };
    await sendMail({ ...base, to: "outbox-a@example.com", subject: "first" });
    await sendMail({ ...base, to: "outbox-b@example.com", subject: "other" });
    await sendMail({
      ...base,
      to: "outbox-a@example.com",
      subject: "second",
      replyTo: "r@example.com",
    });
    const response = GET(new Request("http://localhost/api/test/outbox?to=outbox-a@example.com"));
    const { messages } = (await response.json()) as { messages: { subject: string }[] };
    expect(messages.map((message) => message.subject)).toEqual(["first", "second"]);
  });
});
