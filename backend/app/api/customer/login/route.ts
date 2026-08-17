import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { customerCookieOptions, signCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";
import { customerLoginSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { allowed } = rateLimit(`customer-login:${clientIp(request)}`, 10, 5 * 60 * 1000);
  if (!allowed) return fail("Too many login attempts. Try again in a few minutes.", 429);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { email, password } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
  // Deliberately identical error for "no such account" and "wrong
  // password" — don't let the response leak which one it was.
  if (!customer) return fail("Invalid email or password", 401);

  const validPassword = await bcrypt.compare(password, customer.passwordHash);
  if (!validPassword) return fail("Invalid email or password", 401);

  const token = await signCustomerToken({ sub: customer.id, email: customer.email });
  const response = ok({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    addressLine1: customer.addressLine1,
    addressCity: customer.addressCity,
    addressPincode: customer.addressPincode,
  });
  response.cookies.set(CUSTOMER_COOKIE_NAME, token, customerCookieOptions);
  return response;
}
