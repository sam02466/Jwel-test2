import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentFromRequest } from "@/lib/agent-auth";
import { agentLocationSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

/**
 * The agent's phone calls this periodically (see src/lib/geolocation.js
 * on the frontend, throttled to roughly once every 15s) while a
 * delivery is in progress. Rather than store a single "current
 * position" on the DeliveryAgent row, this fans the update out to every
 * order this agent currently has OUT_FOR_DELIVERY — an agent could in
 * principle be out with more than one delivery at once, and each
 * order's own map (OrderMap.jsx) should reflect the same live position.
 *
 * Scoped to OUT_FOR_DELIVERY specifically (not ASSIGNED): that's the
 * point in the flow that actually means "en route to the customer" —
 * ASSIGNED just means picked, not yet dispatched.
 */
export async function PATCH(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return fail("Not authenticated", 401);

  // Loose rate limit — a stray client bug that fires this every second
  // instead of every 15s shouldn't be able to hammer the DB unbounded.
  const { allowed } = rateLimit(`agent-location:${agent.sub}`, 12, 60 * 1000);
  if (!allowed) return fail("Too many location updates. Please slow down.", 429);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = agentLocationSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const now = new Date();
  const result = await prisma.order.updateMany({
    where: { assignedAgentId: agent.sub, orderStatus: "OUT_FOR_DELIVERY" },
    data: { agentLatitude: parsed.data.lat, agentLongitude: parsed.data.lng, agentLocationUpdatedAt: now },
  });

  return ok({ updatedOrders: result.count, at: now.toISOString() });
}
