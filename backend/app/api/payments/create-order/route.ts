import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { paymentCreateOrderSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = paymentCreateOrderSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return fail("Order not found", 404);
  if (order.paymentStatus === "PAID") return fail("This order has already been paid for", 409);

  // order.totalAmount is stored in whole rupees (see schema.prisma
  // header) — Razorpay's API always wants the smallest currency unit,
  // so this is the one place that multiplies by 100.
  const razorpayOrder = await getRazorpay().orders.create({
    amount: order.totalAmount * 100,
    currency: "INR",
    receipt: order.id,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  return ok({
    razorpayOrderId: razorpayOrder.id,
    amountPaise: order.totalAmount * 100,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
