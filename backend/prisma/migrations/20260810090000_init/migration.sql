-- Sarika Beauty Hub — Initial migration
-- Hand-written to match prisma/schema.prisma exactly (this sandbox has no
-- network access to run `prisma migrate dev` against a live database).
-- Once DATABASE_URL points at a real Postgres instance, run:
--   npx prisma migrate resolve --applied 20260810090000_init
-- (or just `npx prisma migrate dev` on a fresh database, which will apply
-- this file directly) — see README.md.

-- ── Enums ───────────────────────────────────────────────────────────────

CREATE TYPE "Category" AS ENUM ('NECKLACES', 'EARRINGS', 'RINGS', 'BANGLES', 'MANGALSUTRA', 'BRACELETS', 'ANKLETS', 'KUNDAN_SETS');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "SubscriberRole" AS ENUM ('ADMIN', 'CUSTOMER');

-- ── Tables ──────────────────────────────────────────────────────────────

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT,
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "price" INTEGER NOT NULL,
    "mrp" INTEGER,
    "badge" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.7,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressCity" TEXT,
    "addressPincode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryAgent" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "area" TEXT,
    "vehicle" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAgent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressCity" TEXT NOT NULL,
    "addressPincode" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "subtotal" INTEGER NOT NULL,
    "shipping" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "razorpayOrderId" TEXT,
    "paymentId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "assignedAgentId" TEXT,
    "qrToken" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "role" "SubscriberRole" NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- ── Unique constraints ──────────────────────────────────────────────────

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE UNIQUE INDEX "DeliveryAgent_username_key" ON "DeliveryAgent"("username");
CREATE UNIQUE INDEX "Order_qrToken_key" ON "Order"("qrToken");
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- ── Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_isAvailable_idx" ON "Product"("isAvailable");
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

CREATE INDEX "Customer_email_idx" ON "Customer"("email");

CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");
CREATE INDEX "Order_phone_idx" ON "Order"("phone");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_assignedAgentId_idx" ON "Order"("assignedAgentId");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE INDEX "PushSubscription_role_idx" ON "PushSubscription"("role");

-- ── Foreign keys ────────────────────────────────────────────────────────

ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedAgentId_fkey"
    FOREIGN KEY ("assignedAgentId") REFERENCES "DeliveryAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order deleted → its line items go with it (line items have no meaning
-- without the order; orders are cancelled via orderStatus, not deleted,
-- in normal operation).
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deleting a product with order history is blocked (RESTRICT), not
-- cascaded, so historical orders are never silently orphaned. The admin
-- product-delete route catches the resulting FK violation (Postgres
-- error 23503) and responds 409, guiding the admin to mark the product
-- unavailable instead.
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- orderId is optional on PushSubscription; if the order is deleted, keep
-- the subscription row but clear the link rather than deleting it.
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Data integrity rules ────────────────────────────────────────────────

ALTER TABLE "Product" ADD CONSTRAINT "Product_price_nonnegative" CHECK ("price" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stock" >= 0);

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_price_nonnegative" CHECK ("price" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_subtotal_nonnegative" CHECK ("subtotal" >= 0);

ALTER TABLE "Order" ADD CONSTRAINT "Order_subtotal_nonnegative" CHECK ("subtotal" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_shipping_nonnegative" CHECK ("shipping" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_totalAmount_nonnegative" CHECK ("totalAmount" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_equals_sum" CHECK ("totalAmount" = "subtotal" + "shipping");
