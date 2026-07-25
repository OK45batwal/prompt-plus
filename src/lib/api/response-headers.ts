import { NextResponse } from "next/server";
import { RateLimitResult } from "@/lib/rate-limit";

export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  rateLimit?: RateLimitResult;
  requestId?: string;
}

/**
 * Utility function to return Next.js Response enriched with standard X-Request-Id and X-RateLimit-* headers.
 */
export function jsonResponse(data: unknown, options: ResponseOptions = {}): NextResponse {
  const { status = 200, headers = {}, rateLimit, requestId } = options;

  const resHeaders = new Headers(headers);

  if (requestId) {
    resHeaders.set("x-request-id", requestId);
  }

  if (rateLimit) {
    resHeaders.set("X-RateLimit-Limit", rateLimit.limit.toString());
    resHeaders.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    resHeaders.set(
      "X-RateLimit-Reset",
      Math.ceil((Date.now() + rateLimit.resetMs) / 1000).toString()
    );
  }

  return NextResponse.json(data, {
    status,
    headers: resHeaders,
  });
}
