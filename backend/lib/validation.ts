import { z } from "zod";

const CATEGORY_VALUES = [
  "NECKLACES",
  "EARRINGS",
  "RINGS",
  "BANGLES",
  "MANGALSUTRA",
  "BRACELETS",
  "ANKLETS",
  "KUNDAN_SETS",
] as const;

const ORDER_STATUS_VALUES = [
  "PLACED",
  "CONFIRMED",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_METHOD_VALUES = ["UPI", "Card", "COD"] as const;

/** 10-digit Indian mobile number — same rule as the sweet-shop source. */
export const indianPhoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => /^[6-9]\d{9}$/.test(v.slice(-10)), "Enter a valid 10-digit Indian mobile number");

// ── Products ────────────────────────────────────────────────────────────

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  category: z.enum(CATEGORY_VALUES, { errorMap: () => ({ message: "Invalid category" }) }),
  description: z.string().trim().max(2000).optional().nullable(),
  images: z.array(z.string().trim().min(1)).min(1, "At least one image is required"),
  price: z.number().int().positive("Price must be a positive integer (rupees)"),
  mrp: z.number().int().positive().optional().nullable(),
  badge: z.string().trim().max(40).optional().nullable(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).optional(),
  details: z.record(z.string(), z.string()).optional().nullable(),
  featured: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  stock: z.number().int().min(0, "Stock can't be negative"),
  isAvailable: z.boolean().optional().default(true),
});

export const productUpdateSchema = productCreateSchema.partial();

// ── Orders / checkout ──────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
});

export const orderCreateSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(120),
  phone: indianPhoneSchema,
  email: z.string().trim().email().optional().or(z.literal("")).optional(),
  addressLine1: z.string().trim().min(4, "Address is required").max(300),
  addressCity: z.string().trim().min(1, "City is required").max(100),
  addressPincode: z.string().trim().min(4, "PIN code is required").max(10),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES, { errorMap: () => ({ message: "Invalid payment method" }) }),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES, { errorMap: () => ({ message: "Invalid order status" }) }),
});

export const assignOrderSchema = z.object({
  agentId: z.string().min(1),
});

export const verifyQrSchema = z.object({
  qrToken: z.string().min(1),
});

// New — the agent's phone reports its own live position while a
// delivery is out for delivery. See PATCH /api/agent/location.
export const agentLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ── Admin / agent auth (unchanged shape from the sweet-shop source) ───

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const agentLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const agentCreateSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(60),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: indianPhoneSchema.optional(),
  area: z.string().trim().max(120).optional(),
  vehicle: z.string().trim().max(60).optional(),
});

// ── Customer auth — new; the sweet-shop source had no customer
// accounts at all (guest checkout by phone only). ───────────────────

export const customerSignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: indianPhoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const customerUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: indianPhoneSchema.optional(),
  addressLine1: z.string().trim().max(300).optional(),
  addressCity: z.string().trim().max(100).optional(),
  addressPincode: z.string().trim().max(10).optional(),
});

// ── Push / payments (unchanged shape) ──────────────────────────────────

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  role: z.enum(["ADMIN", "CUSTOMER"]),
  orderId: z.string().optional(),
});

export const paymentVerifySchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const paymentCreateOrderSchema = z.object({
  orderId: z.string().min(1),
});

/** Flattens a ZodError into a {field, message}[] list for validationFail(). */
export function formatZodErrors(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}
