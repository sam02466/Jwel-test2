import { customerCookieOptions, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set(CUSTOMER_COOKIE_NAME, "", { ...customerCookieOptions, maxAge: 0 });
  return response;
}
