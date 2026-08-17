import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api-response";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";
import { mapOrder } from "@/lib/order-mapper";
import { ok } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

/**
 * Single-order lookup by opaque id — deliberately unauthenticated, same
 * reasoning as the sweet-shop source: order confirmation
 * (OrderReceipt.jsx) has to work right after checkout for a guest who
 * never signed in, and the id itself (an unguessable cuid) is the
 * access control. CORS-enabled since the frontend may call this
 * cross-origin during separate local dev (see README).
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: { select: { name: true, images: true, category: true } } } },
      assignedAgent: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!order) return withPublicCors(fail("Order not found", 404));
  return withPublicCors(ok(mapOrder(order)));
}

export async function OPTIONS() {
  return corsPreflightResponse();
}
