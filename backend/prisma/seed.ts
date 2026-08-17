import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import productsData from "./seed-data/products.json";

const prisma = new PrismaClient();

/** Same generator the app itself uses (lib/qr-token.ts) — duplicated
 *  here rather than imported so this script has no dependency on the
 *  Next.js path-alias setup tsx doesn't resolve. */
function qrToken() {
  return crypto.randomBytes(24).toString("base64url");
}

// Fixed coordinates for seed data only — real orders get their
// destination from lib/geocode.ts (real address -> real coordinates) at
// checkout time. Seeding calls a live geocoder for a batch of fictional
// demo addresses isn't worth the network round-trips (or the risk of
// hitting Nominatim's rate limit), so the sample orders below just get
// plausible-looking fixed points instead.
const KOLKATA_SPOTS = [
  { lat: 22.5417, lng: 88.3593 },
  { lat: 22.517, lng: 88.3685 },
  { lat: 22.572, lng: 88.432 },
  { lat: 22.524, lng: 88.366 },
  { lat: 22.577, lng: 88.431 },
];

async function main() {
  console.log("Seeding Sarika Beauty Hub…");

  // ── Admin — same demo credentials the frontend's AdminLogin.jsx
  // already shows as a hint, so that page needed no copy changes.
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin@sarikabeautyhub.in" },
    update: {},
    create: { username: "admin@sarikabeautyhub.in", passwordHash: adminPasswordHash },
  });
  console.log("  ok Admin (admin@sarikabeautyhub.in / admin123)");

  // ── Delivery agents — real, individually-hashed passwords (unlike the
  // original prototype's single shared AGENT_PASSWORD constant), but all
  // seeded with the same demo value so AgentLogin.jsx's existing hint
  // text ("Password: agent123") stays accurate without editing that page.
  const agentPasswordHash = await bcrypt.hash("agent123", 10);
  const agentSeeds = [
    { username: "rahul.verma@sarikadelivery.in", name: "Rahul Verma", phone: "+91 98890 11223", area: "Kolkata — Salt Lake & Ballygunge", vehicle: "Bike · WB 05 1234", rating: 4.9 },
    { username: "priya.nair@sarikadelivery.in", name: "Priya Nair", phone: "+91 90909 77888", area: "Kolkata — Park Street & Tollygunge", vehicle: "Scooter · WB 02 8899", rating: 4.8 },
    { username: "arjun.mehta@sarikadelivery.in", name: "Arjun Mehta", phone: "+91 98450 44556", area: "Kolkata — Rajarhat & New Town", vehicle: "Van · WB 24 4433", rating: 4.7 },
  ];
  const agents = [];
  for (const a of agentSeeds) {
    const agent = await prisma.deliveryAgent.upsert({
      where: { username: a.username },
      update: {},
      create: { ...a, passwordHash: agentPasswordHash },
    });
    agents.push(agent);
  }
  console.log(`  ok ${agents.length} delivery agents (any email above / agent123)`);

  // ── Demo customer — same identity Auth.jsx's "Try the demo customer"
  // button already targets, so that page needed no copy changes either.
  const customerPasswordHash = await bcrypt.hash("demo123", 10);
  const demoCustomer = await prisma.customer.upsert({
    where: { email: "demo@sarikabeautyhub.in" },
    update: {},
    create: {
      name: "Ananya Sharma",
      email: "demo@sarikabeautyhub.in",
      phone: "+91 98300 11223",
      passwordHash: customerPasswordHash,
      addressLine1: "12, Shakespeare Sarani",
      addressCity: "Kolkata",
      addressPincode: "700071",
    },
  });
  console.log("  ok Demo customer (demo@sarikabeautyhub.in / demo123)");

  // ── Catalogue — the jewellery frontend's original 24-piece catalogue
  // (src/data/products.js), converted 1:1 into real rows instead of a
  // hardcoded array the admin panel could never actually change.
  const existingCount = await prisma.product.count();
  let products: { id: string; name: string; price: number }[] = [];
  if (existingCount === 0) {
    for (const p of productsData as Array<Record<string, unknown>>) {
      const created = await prisma.product.create({ data: p as never });
      products.push({ id: created.id, name: created.name, price: created.price });
    }
    console.log(`  ok ${products.length} products across 8 collections`);
  } else {
    products = await prisma.product.findMany({ select: { id: true, name: true, price: true } });
    console.log(`  .. Products already seeded (${existingCount}) - skipping`);
  }

  // ── A few sample orders spanning the full status flow, so the admin
  // dashboard, admin orders list, and agent portals aren't empty on
  // first run. Skipped if orders already exist (re-running the seed is
  // safe / idempotent).
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0 && products.length >= 2) {
    const pick = (i: number) => products[i % products.length];
    const spot = (i: number) => KOLKATA_SPOTS[i % KOLKATA_SPOTS.length];

    const orderSeeds: Array<{
      customerId: string | null;
      customerName: string;
      phone: string;
      email: string;
      addressLine1: string;
      addressCity: string;
      addressPincode: string;
      paymentMethod: string;
      orderStatus: "PLACED" | "CONFIRMED" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED";
      paymentStatus: "PENDING" | "PAID";
      assignedAgentId: string | null;
      items: { id: string; name: string; price: number }[];
      deliveredDaysAgo?: number;
    }> = [
      {
        customerId: demoCustomer.id,
        customerName: demoCustomer.name,
        phone: demoCustomer.phone,
        email: demoCustomer.email,
        addressLine1: demoCustomer.addressLine1!,
        addressCity: demoCustomer.addressCity!,
        addressPincode: demoCustomer.addressPincode!,
        paymentMethod: "UPI",
        orderStatus: "DELIVERED",
        paymentStatus: "PAID",
        assignedAgentId: agents[0].id,
        items: [pick(11)],
        deliveredDaysAgo: 4,
      },
      {
        customerId: null,
        customerName: "Ritika Jain",
        phone: "+91 98765 43210",
        email: "ritika.jain@example.com",
        addressLine1: "45, Gariahat Road",
        addressCity: "Kolkata",
        addressPincode: "700029",
        paymentMethod: "UPI",
        orderStatus: "OUT_FOR_DELIVERY",
        paymentStatus: "PAID",
        assignedAgentId: agents[1].id,
        items: [pick(8)],
      },
      {
        customerId: null,
        customerName: "Meghna Kulkarni",
        phone: "+91 99887 66554",
        email: "meghna.k@example.com",
        addressLine1: "88, Ballygunge Circular Road",
        addressCity: "Kolkata",
        addressPincode: "700019",
        paymentMethod: "UPI",
        orderStatus: "ASSIGNED",
        paymentStatus: "PAID",
        assignedAgentId: agents[2].id,
        items: [pick(2)],
      },
      {
        customerId: null,
        customerName: "Sneha Reddy",
        phone: "+91 91234 56789",
        email: "sneha.r@example.com",
        addressLine1: "3, Salt Lake Sector V",
        addressCity: "Kolkata",
        addressPincode: "700091",
        paymentMethod: "COD",
        orderStatus: "CONFIRMED",
        paymentStatus: "PENDING",
        assignedAgentId: null,
        items: [pick(0), pick(17)],
      },
      {
        customerId: null,
        customerName: "Priyanka Das",
        phone: "+91 90000 77885",
        email: "priyanka.d@example.com",
        addressLine1: "16, Park Street",
        addressCity: "Kolkata",
        addressPincode: "700016",
        paymentMethod: "UPI",
        orderStatus: "PLACED",
        paymentStatus: "PENDING",
        assignedAgentId: null,
        items: [pick(15)],
      },
    ];

    for (const [i, seed] of orderSeeds.entries()) {
      const subtotal = seed.items.reduce((s, p) => s + p.price, 0);
      const deliveredAt = seed.deliveredDaysAgo
        ? new Date(Date.now() - seed.deliveredDaysAgo * 24 * 60 * 60 * 1000)
        : null;

      await prisma.order.create({
        data: {
          customerId: seed.customerId,
          customerName: seed.customerName,
          phone: seed.phone,
          email: seed.email,
          addressLine1: seed.addressLine1,
          addressCity: seed.addressCity,
          addressPincode: seed.addressPincode,
          paymentMethod: seed.paymentMethod,
          paymentStatus: seed.paymentStatus,
          orderStatus: seed.orderStatus,
          subtotal,
          shipping: 0,
          totalAmount: subtotal,
          assignedAgentId: seed.assignedAgentId,
          qrToken: qrToken(),
          latitude: spot(i).lat,
          longitude: spot(i).lng,
          deliveredAt,
          items: {
            create: seed.items.map((p) => ({ productId: p.id, quantity: 1, price: p.price, subtotal: p.price })),
          },
        },
      });
    }
    console.log(`  ok ${orderSeeds.length} sample orders (placed through delivered)`);
  } else {
    console.log(`  .. Orders already seeded (${existingOrders}) - skipping`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
