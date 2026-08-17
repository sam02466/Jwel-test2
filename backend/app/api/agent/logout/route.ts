import { agentCookieOptions, AGENT_COOKIE_NAME } from "@/lib/agent-auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set(AGENT_COOKIE_NAME, "", { ...agentCookieOptions, maxAge: 0 });
  return response;
}
