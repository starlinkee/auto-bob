export type MailMessage = {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

export class MailNotConfiguredError extends Error {
  constructor() {
    super("Mail is not configured");
    this.name = "MailNotConfiguredError";
  }
}

const outbox: MailMessage[] = [];

export function getOutbox(): readonly MailMessage[] {
  return outbox;
}

export function defaultSender(): string {
  return process.env.CONTACT_FROM_EMAIL || "BuildRent <onboarding@resend.dev>";
}

export async function sendMail(message: MailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });
    if (!response.ok) throw new Error(`Resend responded with ${response.status}`);
    return;
  }
  if (process.env.ENABLE_TEST_ENDPOINTS === "1") {
    outbox.push({ ...message });
    return;
  }
  throw new MailNotConfiguredError();
}
