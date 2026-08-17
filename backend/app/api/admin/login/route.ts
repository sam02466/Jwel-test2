import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminCookieOptions, signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { adminLoginSchema, formatZodErrors } from "@/lib/validation";
import { fail, ok, validationFail } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Phase 9: rate-limit the login route. 10 attempts / 5 minutes per IP.
  const { allowed } = rateLimit(`login:${clientIp(request)}`, 10, 5 * 60 * 1000);
  if (!allowed) {
    return fail("Too many login attempts. Try again in a few minutes.", 429);
  }

  const body = await request.json().catch(() => null);
  if (!body) return fail("Invalid request body", 400);

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) return validationFail(formatZodErrors(parsed.error));

  const { username, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { username } });
  // Deliberately identical error for "no such user" and "wrong password" —
  // don't let the response leak which one it was.
  if (!admin) return fail("Invalid username or password", 401);

  const validPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!validPassword) return fail("Invalid username or password", 401);

  const token = await signAdminToken({ sub: admin.id, username: admin.username });

  const response = ok({ username: admin.username });
  response.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions);
  return response;
}
