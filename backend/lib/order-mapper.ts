import type { Order, OrderItem, Product, DeliveryAgent } from "@prisma/client";

/**
 * Maps a Prisma Order row to the exact shape the jewellery frontend
 * already expects (src/data/store.js's old createOrder()/DEMO_ORDERS —
 * see backend README "Order shape" section). Every order-returning
 * route funnels through this so the frontend needed zero changes to
 * how it reads an order object, only to how it fetches one.
 */

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Pick<Product, "name" | "images" | "category"> })[];
  assignedAgent: Pick<DeliveryAgent, "id" | "name" | "phone"> | null;
};

export function mapOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    customerPhone: order.phone,
    customerEmail: order.email || "",
    address: {
      line1: order.addressLine1,
      city: order.addressCity,
      pincode: order.addressPincode,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: item.price,
      qty: item.quantity,
      image: item.product.images[0] || "",
      category: item.product.category,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.totalAmount,
    payment: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.orderStatus.toLowerCase(),
    agentId: order.assignedAgentId,
    agentName: order.assignedAgent?.name ?? null,
    // The token embedded here (not the customer's phone number, unlike
    // the original prototype) is what POST /orders/[id]/verify-qr checks
    // server-side — see that route + README "QR handover" section.
    qr: order.qrToken ? `SARIKA|${order.id}|${order.qrToken}` : null,
    // Real geocoded delivery destination (see lib/geocode.ts) — null,
    // not a fake placeholder pin, until geocoding has actually
    // succeeded for this address.
    coords: order.latitude != null && order.longitude != null ? { lat: order.latitude, lng: order.longitude } : null,
    // The assigned agent's own live position, reported by their phone
    // (see PATCH /api/agent/location) while out for delivery. Null
    // until they've shared at least one position.
    agentCoords:
      order.agentLatitude != null && order.agentLongitude != null
        ? {
            lat: order.agentLatitude,
            lng: order.agentLongitude,
            updatedAt: order.agentLocationUpdatedAt ? order.agentLocationUpdatedAt.toISOString() : null,
          }
        : null,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
  };
}
