import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { paymentVerifySchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { notifyAdmins } from "@/lib/push";
import { sendSms } from "@/lib/sms";
import { sendEmail, orderConfirmedEmailBody } from "@/lib/email";
import { formatNewOrderAdminMessage, formatOrderStatusMessage } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = paymentVerifySchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return fail("Payment verification is not configured", 500);

  // Standard Razorpay signature check: HMAC-SHA256 of "{order_id}|{payment_id}"
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const signatureValid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!signatureValid) {
    return fail("Payment verification failed", 400);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail("Order not found", 404);
  if (order.razorpayOrderId !== razorpay_order_id) {
    return fail("Payment does not match this order", 400);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID", orderStatus: "CONFIRMED", paymentId: razorpay_payment_id },
  });

  await Promise.allSettled([
    notifyAdmins({ title: "New order", body: formatNewOrderAdminMessage(updated.id, updated.totalAmount) }),
    sendSms(updated.phone, formatOrderStatusMessage(updated.id, "CONFIRMED")),
    updated.email
      ? sendEmail(updated.email, "Your Sarika Beauty Hub order is confirmed", orderConfirmedEmailBody(updated.id, updated.totalAmount))
      : Promise.resolve(),
  ]);

  return ok({ orderId: updated.id, paymentStatus: updated.paymentStatus, orderStatus: updated.orderStatus });
}
