import { getOutbox } from "@/lib/mail";

export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  if (process.env.ENABLE_TEST_ENDPOINTS !== "1") {
    return new Response("Not found", { status: 404 });
  }
  const to = new URL(request.url).searchParams.get("to");
  const messages = getOutbox()
    .filter((message) => message.to === to)
    .map(({ to: recipient, from, replyTo, subject, text }) => ({
      to: recipient,
      from,
      replyTo,
      subject,
      text,
    }));
  return Response.json({ messages });
}
