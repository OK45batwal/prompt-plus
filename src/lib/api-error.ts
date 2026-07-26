import { NextResponse } from "next/server";

export function apiError(error: unknown, defaultMessage = "Something went wrong", status = 500) {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error(`[API] ${status} ${message}`, error instanceof Error ? error.stack : "");
  return NextResponse.json({ error: message }, { status });
}

export function apiValidation(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function apiNotFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
