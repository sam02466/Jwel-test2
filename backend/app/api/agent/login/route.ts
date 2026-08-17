import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { agentCookieOptions, signAgentToken, AGENT_COOKIE_NAME } from "@/lib/agent-auth";
import { agentLoginSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { allowed } = rateLimit(`agent-login:${clientIp(request)}`, 10, 5 * 60 * 1000);
  if (!allowed) return fail("Too many login attempts. Try again in a few minutes.", 429);

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = agentLoginSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { username, password } = parsed.data;

  const agent = await prisma.deliveryAgent.findUnique({ where: { username } });
  if (!agent) return fail("Invalid username or password", 401);
  if (!agent.isActive) return fail("This account has been deactivated", 403);

  const validPassword = await bcrypt.compare(password, agent.passwordHash);
  if (!validPassword) return fail("Invalid username or password", 401);

  const token = await signAgentToken({ sub: agent.id, username: agent.username });

  const response = ok({
    id: agent.id,
    username: agent.username,
    name: agent.name,
    phone: agent.phone,
    area: agent.area,
    vehicle: agent.vehicle,
    rating: agent.rating,
  });
  response.cookies.set(AGENT_COOKIE_NAME, token, agentCookieOptions);
  return response;
}
