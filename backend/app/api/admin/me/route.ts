import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);
  return ok({ username: admin.username });
}
