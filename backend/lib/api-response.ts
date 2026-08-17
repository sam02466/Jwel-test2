import { NextResponse } from "next/server";

/**
 * Response envelope — 05_API_SPECIFICATION.md §2. Every route in this
 * package returns one of these three shapes and nothing else.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function validationFail(errors: { field: string; message: string }[]) {
  return NextResponse.json({ success: false, errors }, { status: 422 });
}
