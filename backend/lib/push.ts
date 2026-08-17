import webpush from "web-push";
import { prisma } from "./prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT are not set");
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Sends to one subscription; deletes it from the DB if the push service
 *  reports it's gone (410/404 — the browser unsubscribed or expired). */
async function sendToSubscription(sub: StoredSubscription, payload: PushPayload) {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    } else {
      console.error("Push send failed:", err);
    }
  }
}

/** Order paid → notify every admin (Phase 6/7 trigger point). */
export async function notifyAdmins(payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { role: "ADMIN" } });
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}

/** Admin updates order status → notify that order's customer, if subscribed. */
export async function notifyOrderCustomer(orderId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { role: "CUSTOMER", orderId } });
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}
