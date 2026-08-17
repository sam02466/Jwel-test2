/**
 * In-memory sliding-window rate limiter.
 *
 * 03_IMPLEMENTATION_PLAN.md Phase 9 suggests Upstash (Redis) rate
 * limiting, which needs its own service + env vars that aren't in
 * 08_DEPLOYMENT_GUIDE.md's env var list. Rather than silently add an
 * external dependency the docs never mention, this ships a
 * same-process, in-memory limiter instead — enough to demonstrate and
 * enforce the requirement on a single instance, but it resets on
 * redeploy and does NOT share state across serverless instances/regions.
 * Swap this for Upstash (or similar) before relying on it in a real
 * multi-instance production deployment.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** Best-effort client identifier — Vercel sets x-forwarded-for. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
