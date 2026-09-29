import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const { version } = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
  version: string;
};

const methodNotAllowed = () => new Response(null, { status: 405, headers: { Allow: "GET" } });

export function GET() {
  return Response.json({ status: "ok", uptimeSeconds: process.uptime(), version });
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
