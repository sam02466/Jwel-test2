import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { fail, ok } from "@/lib/api-response";
import { mapOrder } from "@/lib/order-mapper";

/**
 * A signed-in customer's own order history. New relative to the
 * sweet-shop source (which had no customer accounts, only an
 * unauthenticated ?phone= lookup on GET /api/orders — that route is
 * kept too, for guest checkout, but this one is properly scoped to
 * "orders this authenticated customer actually placed").
 */
export async function GET(request: NextRequest) {
  const token = await getCustomerFromRequest(request);
  if (!token) return fail("Not authenticated", 401);

  const orders = await prisma.order.findMany({
    where: { customerId: token.sub },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { name: true, images: true, category: true } } } },
      assignedAgent: { select: { id: true, name: true, phone: true } },
    },
  });

  return ok({ orders: orders.map(mapOrder) });
}
