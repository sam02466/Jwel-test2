import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { customerUpdateSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";

function serialize(customer: {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine1: string | null;
  addressCity: string | null;
  addressPincode: string | null;
}) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    addressLine1: customer.addressLine1,
    addressCity: customer.addressCity,
    addressPincode: customer.addressPincode,
  };
}

/** Restores a customer session on page load — the frontend's
 *  AuthContext calls this once on mount since the JWT lives in an
 *  httpOnly cookie it can't read directly. */
export async function GET(request: NextRequest) {
  const token = await getCustomerFromRequest(request);
  if (!token) return fail("Not authenticated", 401);

  const customer = await prisma.customer.findUnique({ where: { id: token.sub } });
  if (!customer) return fail("Not authenticated", 401);

  return ok(serialize(customer));
}

/** Profile edits from the Account page (src/pages/customer/Account.jsx). */
export async function PATCH(request: NextRequest) {
  const token = await getCustomerFromRequest(request);
  if (!token) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const customer = await prisma.customer.update({
    where: { id: token.sub },
    data: parsed.data,
  });

  return ok(serialize(customer));
}
