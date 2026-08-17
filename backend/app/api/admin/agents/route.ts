import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { agentCreateSchema, formatZodErrors } from "@/lib/validation";
import { created, fail, ok, validationFail } from "@/lib/api-response";

const AGENT_SELECT = {
  id: true,
  username: true,
  name: true,
  phone: true,
  area: true,
  vehicle: true,
  rating: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  // Only active agents — AdminAgents.jsx's "remove agent" soft-deletes
  // (see [id]/route.ts DELETE) by setting isActive: false, so a removed
  // agent should simply stop appearing here, matching the original
  // hard-delete UX the frontend was built against.
  const agents = await prisma.deliveryAgent.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: AGENT_SELECT,
  });
  return ok({ agents });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = agentCreateSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { username, password, name, phone, area, vehicle } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const agent = await prisma.deliveryAgent.create({
      data: { username, passwordHash, name, phone, area, vehicle },
      select: AGENT_SELECT,
    });
    return created(agent);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return fail("That username is already taken", 409);
    }
    throw err;
  }
}
