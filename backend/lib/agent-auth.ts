import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

/**
 * Deliberately separate from admin auth (own env var, own cookie name,
 * own secret) — not in any doc (the delivery-agent feature isn't either),
 * but a shared secret/cookie between two very differently-privileged
 * roles would be an easy way to accidentally let an agent session pass
 * an admin check or vice versa. AGENT_JWT_SECRET is a new required env
 * var — see backend README's "Deviations" section.
 */

export const AGENT_COOKIE_NAME = "agent_token";
const AGENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AGENT_JWT_SECRET;
  if (!secret) {
    throw new Error("AGENT_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface AgentTokenPayload {
  sub: string; // DeliveryAgent.id
  username: string;
}

export async function signAgentToken(payload: AgentTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AGENT_COOKIE_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyAgentToken(token: string): Promise<AgentTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.username !== "string") return null;
    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export const agentCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: AGENT_COOKIE_MAX_AGE,
};

export async function getAgentFromRequest(request: NextRequest): Promise<AgentTokenPayload | null> {
  const token = request.cookies.get(AGENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAgentToken(token);
}
