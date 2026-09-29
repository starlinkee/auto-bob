import { contactSchema, type ContactData } from "@/lib/contact-schema";
import { defaultSender, MailNotConfiguredError, sendMail } from "@/lib/mail";
import { getMachines } from "@/lib/machines";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getSite } from "@/lib/site";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20 * 1024;

function json(body: unknown, status: number, headers?: Record<string, string>): Response {
  return Response.json(body, { status, headers });
}

function describe(data: ContactData, machineNames: string[]): string {
  const yesNo = (value: boolean) => (value ? "yes" : "no");
  return [
    `Name: ${data.name}`,
    `Company: ${data.company ?? "-"}`,
    `E-mail: ${data.email}`,
    `Phone: ${data.phone}`,
    `Machines: ${machineNames.length ? machineNames.join(", ") : "-"}`,
    `Start date: ${data.startDate ?? "-"}`,
    `Rental days: ${data.days ?? "-"}`,
    `Delivery: ${yesNo(data.delivery)}`,
    `Delivery location: ${data.delivery ? (data.location ?? "-") : "-"}`,
    `Operator: ${yesNo(data.operator)}`,
    "",
    "Message:",
    data.message,
  ].join("\n");
}

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "unsupported_media_type" }, 415);
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  const limit = rateLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return json({ error: "rate_limited" }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { website?: unknown }).website === "string" &&
    (body as { website: string }).website !== ""
  ) {
    return json({ ok: true }, 200);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "validation", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      400,
    );
  }
  const data = parsed.data;

  const catalogue = new Map(getMachines().map((machine) => [machine.slug, machine.name]));
  const unknown = data.machines.filter((slug) => !catalogue.has(slug));
  if (unknown.length > 0) {
    return json(
      {
        error: "validation",
        fieldErrors: { machines: [`Unknown machine: ${unknown.join(", ")}`] },
      },
      400,
    );
  }
  const machineNames = data.machines.map((slug) => catalogue.get(slug) as string);

  const site = getSite();
  const from = defaultSender();
  const to = process.env.CONTACT_TO_EMAIL || site.email;
  const summary = describe(data, machineNames);

  try {
    await sendMail({
      to,
      from,
      replyTo: data.email,
      subject: `Quote request from ${data.name}`,
      text: summary,
    });
    await sendMail({
      to: data.email,
      from,
      subject: `We received your quote request – ${site.name}`,
      text: [
        `Hello ${data.name},`,
        "",
        "Thank you for your enquiry. We will reply within one business day.",
        `If it is urgent, call us on ${site.phone}.`,
        "",
        "Your request:",
        "",
        summary,
        "",
        `${site.name}`,
      ].join("\n"),
    });
  } catch (error) {
    if (error instanceof MailNotConfiguredError) return json({ error: "mail_not_configured" }, 503);
    return json({ error: "send_failed" }, 502);
  }

  return json({ ok: true }, 200);
}
