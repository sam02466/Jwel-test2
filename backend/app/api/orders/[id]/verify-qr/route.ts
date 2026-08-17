import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { getAgentFromRequest } from "@/lib/agent-auth";
import { verifyQrSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { mapOrder } from "@/lib/order-mapper";

interface Params {
  params: { id: string };
}

const ORDER_INCLUDE = {
  items: { include: { product: { select: { name: true, images: true, category: true } } } },
  assignedAgent: { select: { id: true, name: true, phone: true } },
} as const;

/**
 * Completes a QR handover — the real authorization is the qrToken
 * match (a random 24-byte value generated at checkout, never the
 * customer's phone number the way the original localStorage prototype
 * encoded it). The session check on top (must be an admin, or the
 * specific agent this order is assigned to) is defense-in-depth, not
 * the sole gate — stops a stray agent completing someone else's
 * delivery even if they somehow saw the token.
 *
 * AgentOrderDetail.jsx's two-step UI (scan → "Confirm Delivery" button)
 * is preserved: the frontend does a lightweight local pre-check that
 * the scanned text's order id matches the page it's on for immediate
 * feedback, then calls this route — the actual, atomic state
 * transition — only when the agent taps "Confirm Delivery".
 */
export async function POST(request: NextRequest, { params }: Params) {
  const [admin, agent] = await Promise.all([getAdminFromRequest(request), getAgentFromRequest(request)]);
  if (!admin && !agent) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = verifyQrSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Order not found", 404);

  if (agent && !admin && order.assignedAgentId !== agent.sub) {
    return fail("This order isn't assigned to you", 403);
  }
  if (!order.qrToken || order.qrToken !== parsed.data.qrToken) {
    return fail("QR code doesn't match this order", 400);
  }
  if (order.orderStatus === "DELIVERED") {
    return fail("This order was already marked delivered", 409);
  }
  if (order.orderStatus === "CANCELLED") {
    return fail("This order was cancelled", 409);
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { orderStatus: "DELIVERED", deliveredAt: new Date() },
    include: ORDER_INCLUDE,
  });

  return ok(mapOrder(updated));
}
