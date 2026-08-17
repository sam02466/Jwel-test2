import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { orderStatusUpdateSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { notifyOrderCustomer } from "@/lib/push";
import { sendSms } from "@/lib/sms";
import { formatOrderStatusMessage } from "@/lib/notifications";
import { mapOrder } from "@/lib/order-mapper";

interface Params {
  params: { id: string };
}

const ORDER_INCLUDE = {
  items: { include: { product: { select: { name: true, images: true, category: true } } } },
  assignedAgent: { select: { id: true, name: true, phone: true } },
} as const;

/**
 * Admin-only free status change (confirm / dispatch / mark delivered /
 * cancel — see AdminOrders.jsx's action buttons). Agents don't use this
 * route: their "mark delivered" goes through /verify-qr instead, which
 * requires the actual QR handover, not just a status flip.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  let order;
  try {
    order = await prisma.order.update({
      where: { id: params.id },
      data: {
        orderStatus: parsed.data.status,
        deliveredAt: parsed.data.status === "DELIVERED" ? new Date() : undefined,
      },
      include: ORDER_INCLUDE,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return fail("Order not found", 404);
    }
    throw err;
  }

  const message = formatOrderStatusMessage(order.id, order.orderStatus);
  await Promise.allSettled([
    notifyOrderCustomer(order.id, { title: "Order update", body: message }),
    sendSms(order.phone, message),
  ]);

  return ok(mapOrder(order));
}
