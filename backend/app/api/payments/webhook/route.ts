import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/push";
import { sendSms } from "@/lib/sms";
import { sendEmail, orderConfirmedEmailBody } from "@/lib/email";
import { formatNewOrderAdminMessage, formatOrderStatusMessage } from "@/lib/notifications";

/**
 * Razorpay signs webhook deliveries with a *separate* secret configured
 * in the Razorpay dashboard — RAZORPAY_WEBHOOK_SECRET, not
 * RAZORPAY_KEY_SECRET (that one's for /payments/verify's signature).
 * Verifying it is not optional — an unverified endpoint here would let
 * anyone POST a fake "payment captured" event.
 *
 * This is a backstop, not the primary path: /payments/verify (called
 * right after the Checkout widget closes) is what the customer's own
 * flow depends on. The webhook exists to catch the case where the
 * browser tab closes/crashes between a successful payment and that
 * verify call ever firing.
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  if (event.event !== "payment.captured") {
    return NextResponse.json({ success: true, ignored: true });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  if (!razorpayOrderId) return NextResponse.json({ success: true, ignored: true });

  const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
  if (!order || order.paymentStatus === "PAID") {
    return NextResponse.json({ success: true, alreadyHandled: true });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", orderStatus: "CONFIRMED", paymentId: payment.id },
  });

  await Promise.allSettled([
    notifyAdmins({ title: "New order", body: formatNewOrderAdminMessage(updated.id, updated.totalAmount) }),
    sendSms(updated.phone, formatOrderStatusMessage(updated.id, "CONFIRMED")),
    updated.email
      ? sendEmail(updated.email, "Your Sarika Beauty Hub order is confirmed", orderConfirmedEmailBody(updated.id, updated.totalAmount))
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
