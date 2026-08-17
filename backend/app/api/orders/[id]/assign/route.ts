import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { assignOrderSchema, formatZodErrors } from "@/lib/validation";
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

/** Admin assigns a delivery agent — moves the order to ASSIGNED (not
 *  straight to OUT_FOR_DELIVERY, unlike the sweet-shop source this was
 *  adapted from: the jewellery frontend's 5-step tracker has its own
 *  "Delivery Assigned" step the agent picks up from before dispatching). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = assignOrderSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Order not found", 404);

  const agent = await prisma.deliveryAgent.findUnique({ where: { id: parsed.data.agentId } });
  if (!agent || !agent.isActive) return fail("Delivery agent not found or inactive", 404);

  let updated;
  try {
    updated = await prisma.order.update({
      where: { id: params.id },
      data: { assignedAgentId: agent.id, orderStatus: "ASSIGNED" },
      include: ORDER_INCLUDE,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return fail("Order not found", 404);
    }
    throw err;
  }

  const message = formatOrderStatusMessage(updated.id, "ASSIGNED");
  await Promise.allSettled([
    notifyOrderCustomer(updated.id, { title: "Order update", body: message }),
    sendSms(updated.phone, message),
  ]);

  return ok(mapOrder(updated));
}
