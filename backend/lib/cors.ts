import { NextResponse } from "next/server";

/**
 * Applies permissive CORS only where it's actually safe: a route that is
 * (a) already unauthenticated by design — no cookie, no credential, the
 * resource id itself is the access control — and (b) read-only. The
 * order-lookup route is exactly that (see its own file for the reasoning
 * on why it's public at all). `Access-Control-Allow-Origin: *` is fine
 * here specifically *because* there's no cookie/credential involved and
 * the response doesn't vary by caller — allowing it cross-origin doesn't
 * expose anything a same-origin caller couldn't already get.
 *
 * Deliberately NOT applied to admin/agent routes — those stay
 * same-origin only, which is correct once frontend+backend are merged
 * into one app (Task 4) and matters during separate local dev too, since
 * cookie-based auth shouldn't be relaxed cross-origin.
 *
 * Needed right now because the frontend and backend packages run as two
 * separate local servers before integration — see both READMEs.
 */
export function withPublicCors<T extends NextResponse>(response: T): T {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

export function corsPreflightResponse(): NextResponse {
  return withPublicCors(new NextResponse(null, { status: 204 }));
}
