import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

/**
 * Third, independent auth track alongside admin and agent (own env var,
 * own cookie name, own secret) — same reasoning as agent-auth.ts: a
 * shared secret between differently-privileged roles is an easy way to
 * accidentally let one role's session pass another role's check.
 * CUSTOMER_JWT_SECRET is a new required env var — see README.md.
 *
 * This whole file is new — the sweet-shop source had no customer
 * accounts at all (guest checkout by phone only).
 */

export const CUSTOMER_COOKIE_NAME = "customer_token";
const CUSTOMER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — customers expect to stay signed in

function secretKey() {
  const secret = process.env.CUSTOMER_JWT_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface CustomerTokenPayload {
  sub: string; // Customer.id
  email: string;
}

export async function signCustomerToken(payload: CustomerTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_COOKIE_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const customerCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: CUSTOMER_COOKIE_MAX_AGE,
};

export async function getCustomerFromRequest(request: NextRequest): Promise<CustomerTokenPayload | null> {
  const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}
