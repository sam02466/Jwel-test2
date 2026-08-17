import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushSubscribeSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { endpoint, keys, role, orderId } = parsed.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, role, orderId: role === "CUSTOMER" ? orderId : null },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      role,
      orderId: role === "CUSTOMER" ? orderId : null,
    },
  });

  return ok({ subscribed: true });
}
