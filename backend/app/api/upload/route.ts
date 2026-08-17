import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { getAdminFromRequest } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("Not authenticated", 401);

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return fail("No file provided (expected multipart/form-data field 'file')", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail("Unsupported file type — use JPEG, PNG, or WebP", 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return fail("File too large — max 5MB", 400);
  }

  const blob = await put(`products/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return ok({ url: blob.url });
}
