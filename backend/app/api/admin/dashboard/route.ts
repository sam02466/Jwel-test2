import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";

/**
 * Not currently called by any page — AdminDashboard.jsx computes its
 * stats client-side from the orders/products/agents already in
 * DataContext, which is simpler for a boutique-sized catalogue and
 * needed no backend change. Kept working (and adapted to the jewellery
 * status enum + rupee-denominated amounts) in case a future page wants
 * server-aggregated stats instead of recomputing from the full order
 * list on every load.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [todaysOrders, pendingOrders, productCount, customerCount, revenueAgg, dailyRows] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { orderStatus: { in: ["PLACED", "CONFIRMED"] } } }),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: sevenDaysAgo } },
      _sum: { totalAmount: true },
    }),
    prisma.$queryRaw<{ day: Date; amount: bigint | null }[]>`
      SELECT date_trunc('day', "createdAt") AS day, SUM("totalAmount") AS amount
      FROM "Order"
      WHERE "paymentStatus" = 'PAID' AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY day ORDER BY day ASC
    `,
  ]);

  const dailySales = dailyRows.map((r) => ({
    label: r.day.toLocaleDateString("en-IN", { weekday: "short" }),
    amount: Number(r.amount ?? 0), // already rupees — no /100 (see schema.prisma header)
  }));

  return ok({
    todaysOrders,
    pendingOrders,
    totalRevenue: revenueAgg._sum.totalAmount ?? 0,
    productCount,
    customerCount,
    dailySales,
  });
}
