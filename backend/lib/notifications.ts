import type { OrderStatus } from "@prisma/client";

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  PLACED: "Your order has been received and is awaiting confirmation.",
  CONFIRMED: "Your order is confirmed and is being prepared with care.",
  ASSIGNED: "A delivery agent has been assigned to your order.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order has been delivered. Thank you for shopping with us!",
  CANCELLED: "Your order has been cancelled.",
};

export function formatOrderStatusMessage(orderId: string, status: OrderStatus): string {
  return `Order #${orderId.slice(-6)}: ${STATUS_MESSAGES[status]}`;
}

/** Prices are stored in whole rupees (see schema.prisma header), so this
 *  is a plain formatter — no /100 conversion, unlike the sweet-shop
 *  source this was adapted from (which stored paise). */
export function formatNewOrderAdminMessage(orderId: string, totalAmountRupees: number): string {
  const rupees = totalAmountRupees.toLocaleString("en-IN");
  return `New order #${orderId.slice(-6)} — ₹${rupees}`;
}
