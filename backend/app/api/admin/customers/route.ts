import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";

/**
 * Not currently called by any page (the ported frontend doesn't have an
 * AdminCustomers.jsx yet), but genuinely more capable than the
 * sweet-shop source it's adapted from: that version had no Customer
 * model at all and derived a customer list by grouping guest Order rows
 * by phone number. This one queries the real Customer table directly
 * and folds in each customer's order stats — ready for an admin
 * "Customers" page to be added later.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";

  const [customers, orderStats] = await Promise.all([
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { customerId: { not: null } },
      _count: { _all: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true },
    }),
  ]);

  const statsByCustomer = new Map(orderStats.map((s) => [s.customerId, s]));

  let result = customers.map((c) => {
    const stats = statsByCustomer.get(c.id);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      orderCount: stats?._count._all ?? 0,
      totalSpent: stats?._sum.totalAmount ?? 0,
      lastOrderAt: stats?._max.createdAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    };
  });

  if (search) {
    result = result.filter((c) => c.name.toLowerCase().includes(search) || c.phone.includes(search) || c.email.toLowerCase().includes(search));
  }

  return ok({ customers: result });
}
