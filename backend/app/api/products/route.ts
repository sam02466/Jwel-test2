import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { productCreateSchema, formatZodErrors } from "@/lib/validation";
import { created, fail, ok, validationFail } from "@/lib/api-response";
import type { Prisma, Category } from "@prisma/client";

const VALID_CATEGORIES: Category[] = [
  "NECKLACES",
  "EARRINGS",
  "RINGS",
  "BANGLES",
  "MANGALSUTRA",
  "BRACELETS",
  "ANKLETS",
  "KUNDAN_SETS",
];

/**
 * Public catalogue read (Shop.jsx, Home.jsx, ProductCard everywhere) —
 * anonymous/customer requests only see isAvailable products; an
 * authenticated admin also sees unavailable/out-of-stock ones, since
 * AdminProducts.jsx manages those too. No pagination — a boutique
 * catalogue of a few dozen pieces is small enough to return whole,
 * unlike the sweet-shop source this was adapted from.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Prisma.ProductWhereInput = {};
  if (!admin) where.isAvailable = true;
  if (category && VALID_CATEGORIES.includes(category as Category)) {
    where.category = category as Category;
  }
  if (search) where.name = { contains: search, mode: "insensitive" };

  const products = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" } });
  return ok({ products });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const product = await prisma.product.create({ data: parsed.data });
  return created(product);
}
