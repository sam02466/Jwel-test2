import { NextRequest } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { orderCreateSchema, indianPhoneSchema, formatZodErrors } from "@/lib/validation";
import { created, fail, ok, validationFail } from "@/lib/api-response";
import { computeShipping } from "@/lib/pricing";
import { generateQrToken } from "@/lib/qr-token";
import { geocodeAddress } from "@/lib/geocode";
import { mapOrder } from "@/lib/order-mapper";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";
import { notifyAdmins } from "@/lib/push";
import { sendEmail, orderConfirmedEmailBody } from "@/lib/email";
import { formatNewOrderAdminMessage } from "@/lib/notifications";

const ORDER_INCLUDE = {
  items: { include: { product: { select: { name: true, images: true, category: true } } } },
  assignedAgent: { select: { id: true, name: true, phone: true } },
} as const;

/**
 * POST /api/orders — creates an order pre-payment. Prices are always
 * computed from the current Product rows here, never taken from the
 * request body. Works for both a signed-in customer (their id is read
 * from the customer_token cookie, if present) and a guest checkout —
 * the jewellery frontend supports both, matching its original
 * localStorage-era design (see Checkout.jsx).
 */
export async function POST(request: NextRequest) {
  const { allowed } = rateLimit(`order:${clientIp(request)}`, 20, 5 * 60 * 1000);
  if (!allowed) return fail("Too many orders placed. Please wait a few minutes.", 429);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { customerName, phone, email, addressLine1, addressCity, addressPincode, paymentMethod, items } =
    parsed.data;

  const customerToken = await getCustomerFromRequest(request);

  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }
  const productIds = [...quantityByProduct.keys()];

  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productById = new Map(products.map((p) => [p.id, p]));

  const errors: { field: string; message: string }[] = [];
  for (const [productId, quantity] of quantityByProduct) {
    const product = productById.get(productId);
    if (!product) {
      errors.push({ field: "items", message: `Product ${productId} does not exist` });
    } else if (!product.isAvailable) {
      errors.push({ field: "items", message: `${product.name} is currently unavailable` });
    } else if (product.stock < quantity) {
      errors.push({ field: "items", message: `Only ${product.stock} of ${product.name} left in stock` });
    }
  }
  if (errors.length > 0) return validationFail(errors);

  const subtotal = [...quantityByProduct.entries()].reduce(
    (sum, [productId, quantity]) => sum + productById.get(productId)!.price * quantity,
    0
  );
  const shipping = computeShipping(subtotal);
  const totalAmount = subtotal + shipping;
  // Best-effort — a flaky geocoder should never block checkout. The
  // agent's map just shows "location pending" until this (or a later
  // retry) succeeds; see lib/geocode.ts and OrderMap.jsx.
  const destination = await geocodeAddress(addressLine1, addressCity, addressPincode);

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Atomic, race-safe stock decrement — aborts (and rolls back the
      // whole transaction) if a concurrent order already took the stock.
      for (const [productId, quantity] of quantityByProduct) {
        const result = await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (result.count === 0) {
          throw new Error(`INSUFFICIENT_STOCK:${productById.get(productId)!.name}`);
        }
      }

      return tx.order.create({
        data: {
          customerId: customerToken?.sub ?? null,
          customerName,
          phone,
          email: email || null,
          addressLine1,
          addressCity,
          addressPincode,
          paymentMethod,
          subtotal,
          shipping,
          totalAmount,
          latitude: destination?.lat ?? null,
          longitude: destination?.lng ?? null,
          qrToken: generateQrToken(),
          items: {
            create: [...quantityByProduct.entries()].map(([productId, quantity]) => ({
              productId,
              quantity,
              price: productById.get(productId)!.price,
              subtotal: productById.get(productId)!.price * quantity,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });
    });

    // COD orders never touch /payments/verify (there's no payment step
    // to trigger it), so this is the only point they'd ever notify
    // anyone — without it, an admin would have no way to know a COD
    // order needs preparing short of checking the dashboard themselves.
    // Online-payment orders are deliberately silent here: they're
    // notified once payment actually clears, not on an order that might
    // still be abandoned mid-checkout.
    if (order.paymentMethod === "COD") {
      await Promise.allSettled([
        notifyAdmins({ title: "New COD order", body: formatNewOrderAdminMessage(order.id, order.totalAmount) }),
        order.email
          ? sendEmail(order.email, "Your Sarika Beauty Hub order is placed", orderConfirmedEmailBody(order.id, order.totalAmount))
          : Promise.resolve(),
      ]);
    }

    return created(mapOrder(order));
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("INSUFFICIENT_STOCK:")) {
      const name = err.message.slice("INSUFFICIENT_STOCK:".length);
      return fail(`${name} sold out while you were checking out. Please review your cart.`, 409);
    }
    throw err;
  }
}

/**
 * GET /api/orders — two distinct modes:
 *  - `?phone=` present → unauthenticated guest order lookup (exact
 *    match on a valid 10-digit number). Same trade-off as the sweet-shop
 *    source this was adapted from: a phone number is far less secret
 *    than an unguessable order id, so this is intentionally limited —
 *    see README "Known limitations". Signed-in customers should use the
 *    properly-scoped GET /api/customer/orders instead.
 *  - no `phone` → admin-only full list.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phoneParam = searchParams.get("phone");

  if (phoneParam) {
    const { allowed } = rateLimit(`order-history:${clientIp(request)}`, 20, 5 * 60 * 1000);
    if (!allowed) return withPublicCors(fail("Too many requests. Please wait a few minutes.", 429));

    const parsedPhone = indianPhoneSchema.safeParse(phoneParam);
    if (!parsedPhone.success) {
      return withPublicCors(fail("Enter a valid 10-digit mobile number", 400));
    }

    const orders = await prisma.order.findMany({
      where: { phone: parsedPhone.data },
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    });
    return withPublicCors(ok({ orders: orders.map(mapOrder) }));
  }

  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: { orderStatus?: OrderStatus; OR?: unknown[] } = {};
  const VALID_STATUSES: OrderStatus[] = ["PLACED", "CONFIRMED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (status && VALID_STATUSES.includes(status as OrderStatus)) where.orderStatus = status as OrderStatus;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: ORDER_INCLUDE,
  });

  return ok({ orders: orders.map(mapOrder) });
}

export async function OPTIONS() {
  return corsPreflightResponse();
}
