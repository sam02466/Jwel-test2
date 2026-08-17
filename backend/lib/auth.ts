import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_token";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface AdminTokenPayload {
  sub: string; // Admin.id
  username: string;
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_COOKIE_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.username !== "string") return null;
    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

/** Cookie attributes shared by the "set" (login) and "clear" (logout) calls. */
export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // same-site cookie per 03_IMPLEMENTATION_PLAN.md Phase 9 (CSRF mitigation)
  path: "/",
  maxAge: ADMIN_COOKIE_MAX_AGE,
};

/** Reads and verifies the admin JWT from an incoming request's cookies.
 *  Returns the payload if valid, or null — callers decide how to respond. */
export async function getAdminFromRequest(request: NextRequest): Promise<AdminTokenPayload | null> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
