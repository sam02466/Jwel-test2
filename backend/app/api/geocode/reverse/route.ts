import { NextRequest } from "next/server";
import { reverseGeocode } from "@/lib/geocode";
import { fail, ok } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

/**
 * GET /api/geocode/reverse?lat=&lng= — powers the checkout page's "Use
 * my current location" button. Public/unauthenticated (a guest hasn't
 * signed up for anything yet at that point in checkout) and rate
 * limited per IP, same reasoning as the other public lookups: this is a
 * convenience for real visitors clicking a button a few times, not
 * something that should let anyone hammer Nominatim through this
 * server for free.
 */
export async function GET(request: NextRequest) {
  const { allowed } = rateLimit(`geocode-reverse:${clientIp(request)}`, 20, 5 * 60 * 1000);
  if (!allowed) return withPublicCors(fail("Too many requests. Please wait a moment and try again.", 429));

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return withPublicCors(fail("Invalid lat/lng", 400));
  }

  const result = await reverseGeocode(lat, lng);
  if (!result) {
    return withPublicCors(fail("Could not determine an address for this location. Please enter it manually.", 404));
  }

  return withPublicCors(ok(result));
}

export async function OPTIONS() {
  return corsPreflightResponse();
}
