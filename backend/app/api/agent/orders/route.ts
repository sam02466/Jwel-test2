import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentFromRequest } from "@/lib/agent-auth";
import { fail, ok } from "@/lib/api-response";
import { mapOrder } from "@/lib/order-mapper";

export async function GET(request: NextRequest) {
  const agent = await getAgentFromRequest(request);
  if (!agent) return fail("Not authenticated", 401);

  const { searchParams } = new URL(request.url);
  // Defaults to active deliveries only; ?includeCompleted=true also
  // returns this agent's DELIVERED/CANCELLED history.
  const includeCompleted = searchParams.get("includeCompleted") === "true";

  const orders = await prisma.order.findMany({
    where: {
      assignedAgentId: agent.sub,
      ...(includeCompleted ? {} : { orderStatus: { notIn: ["DELIVERED", "CANCELLED"] } }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      items: { include: { product: { select: { name: true, images: true, category: true } } } },
      assignedAgent: { select: { id: true, name: true, phone: true } },
    },
  });

  return ok({ orders: orders.map(mapOrder) });
}
