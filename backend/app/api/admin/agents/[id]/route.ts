import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

/**
 * New relative to the sweet-shop source (which only had GET+POST on the
 * collection route) — AdminAgents.jsx's "remove agent" button needs a
 * way to delete one. Sets isActive: false rather than a hard delete, so
 * an agent removed after being assigned deliveries doesn't orphan
 * Order.assignedAgentId's history (that FK is ON DELETE SET NULL, which
 * would silently blank out who delivered a past order).
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  try {
    await prisma.deliveryAgent.update({ where: { id: params.id }, data: { isActive: false } });
    return ok({ deactivated: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return fail("Agent not found", 404);
    }
    throw err;
  }
}
