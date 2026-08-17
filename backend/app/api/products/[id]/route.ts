import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { productUpdateSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return fail("Product not found", 404);
  return ok(product);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  try {
    const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
    return ok(product);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return fail("Product not found", 404);
    }
    throw err;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") return fail("Product not found", 404);
      // P2003: FK violation — OrderItem → Product is ON DELETE RESTRICT
      // on purpose, so historical orders are never silently orphaned.
      if (err.code === "P2003") {
        return fail(
          "This piece appears in past orders and can't be deleted. Mark it unavailable instead.",
          409
        );
      }
    }
    throw err;
  }
}
