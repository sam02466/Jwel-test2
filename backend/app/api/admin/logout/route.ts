import { adminCookieOptions, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  const response = ok({ loggedOut: true });
  // Overwrite with an already-expired cookie of the same name/path — the
  // reliable way to clear an httpOnly cookie from a Route Handler.
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}
