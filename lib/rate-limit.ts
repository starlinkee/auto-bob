type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const max = Number(process.env.CONTACT_RATE_LIMIT_MAX) || 5;
  const windowMs = Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS) || 600000;

  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);

  let entry = windows.get(key);
  if (!entry) {
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }
  entry.count += 1;
  return {
    allowed: entry.count <= max,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function clientKey(headers: Headers): string {
  if (process.env.ENABLE_TEST_ENDPOINTS === "1") {
    const testId = headers.get("x-test-client-id");
    if (testId) return `test:${testId}`;
  }
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
