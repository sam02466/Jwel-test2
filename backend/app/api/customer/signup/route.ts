import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customerCookieOptions, signCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";
import { customerSignupSchema, formatZodErrors } from "@/lib/validation";
import { created, fail, validationFail } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEmail, welcomeEmailBody } from "@/lib/email";

/**
 * The one genuinely new account-creation flow in this backend — the
 * sweet-shop source had no customer accounts at all, only guest
 * checkout by phone. The jewellery frontend already shipped a full
 * sign-up form (src/pages/customer/Auth.jsx) wired to a fake localStorage
 * "database"; this route is what makes it real.
 */
export async function POST(request: NextRequest) {
  const { allowed } = rateLimit(`signup:${clientIp(request)}`, 10, 10 * 60 * 1000);
  if (!allowed) return fail("Too many sign-up attempts. Please wait a few minutes.", 429);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = customerSignupSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { name, email, phone, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const customer = await prisma.customer.create({
      data: { name, email: email.toLowerCase(), phone, passwordHash },
    });

    const token = await signCustomerToken({ sub: customer.id, email: customer.email });
    const response = created({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      addressLine1: customer.addressLine1,
      addressCity: customer.addressCity,
      addressPincode: customer.addressPincode,
    });
    response.cookies.set(CUSTOMER_COOKIE_NAME, token, customerCookieOptions);

    // Fire-and-forget welcome email — never blocks/fails signup itself.
    sendEmail(customer.email, "Welcome to Sarika Beauty Hub", welcomeEmailBody(customer.name)).catch(() => {});

    return response;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return fail("An account with that email already exists", 409);
    }
    throw err;
  }
}
