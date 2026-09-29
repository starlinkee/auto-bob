import { afterEach, describe, expect, it, vi } from "vitest";
import { MailNotConfiguredError, sendMail } from "@/lib/mail";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const message = {
  to: "biuro@example.com",
  from: "BuildRent <onboarding@resend.dev>",
  replyTo: "customer@example.com",
  subject: "Hello",
  text: "Body",
};

describe("sendMail", () => {
  it("posts to Resend with the API key when RESEND_API_KEY is set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendMail(message);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: message.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      reply_to: message.replyTo,
    });
  });

  it("throws when Resend answers with an error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 422 })));
    await expect(sendMail(message)).rejects.toThrow("422");
  });

  it("throws a not-configured error without a key and without test endpoints", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("ENABLE_TEST_ENDPOINTS", "");
    await expect(sendMail(message)).rejects.toBeInstanceOf(MailNotConfiguredError);
  });
});
