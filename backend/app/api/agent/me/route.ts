import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentFromRequest } from "@/lib/agent-auth";
import { fail, ok } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const agentToken = await getAgentFromRequest(request);
  if (!agentToken) return fail("Not authenticated", 401);

  const agent = await prisma.deliveryAgent.findUnique({ where: { id: agentToken.sub } });
  if (!agent || !agent.isActive) return fail("Not authenticated", 401);

  return ok({
    id: agent.id,
    username: agent.username,
    name: agent.name,
    phone: agent.phone,
    area: agent.area,
    vehicle: agent.vehicle,
    rating: agent.rating,
  });
}
