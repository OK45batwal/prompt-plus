import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { validateCsrf } from "@/lib/auth/csrf";
import { jsonResponse } from "./response-headers";
import { logger } from "@/lib/logger";
import { Session } from "next-auth";
import { z } from "zod";

export interface AuthApiContext<T = unknown> {
  session: Session;
  userId: string;
  requestId: string;
  body?: T;
}

export interface WithAuthOptions<T extends z.ZodTypeAny = z.ZodTypeAny> {
  schema?: T;
}

export type AuthenticatedRouteHandler<T = unknown> = (
  req: NextRequest,
  context: AuthApiContext<T>
) => Promise<Response> | Response;

/**
 * Higher-Order Function wrapper for authenticated API v1 route handlers.
 * Enforces session authentication, CSRF validation on mutating methods, request ID extraction,
 * structured logging, and optional Zod schema validation.
 */
export function withAuth<T extends z.ZodTypeAny = z.ZodTypeAny>(
  handler: AuthenticatedRouteHandler<z.infer<T>>,
  options?: WithAuthOptions<T>
) {
  return async (req: NextRequest): Promise<Response> => {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    // 1. Verify Authentication Session
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn("Unauthorized API access attempt", { requestId, path: req.nextUrl?.pathname });
      return jsonResponse({ error: "Unauthorized" }, { status: 401, requestId });
    }

    // 2. Validate CSRF Protection for state-changing HTTP methods
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      logger.warn("CSRF validation failed", { requestId, reason: csrfCheck.reason });
      return jsonResponse(
        { error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403, requestId }
      );
    }

    // 3. Optional Payload Validation with Zod Schema
    let parsedBody: z.infer<T> | undefined;
    if (options?.schema && ["POST", "PUT", "PATCH"].includes(req.method)) {
      try {
        const rawJson = await req.json();
        const parseResult = options.schema.safeParse(rawJson);
        if (!parseResult.success) {
          logger.warn("Request body validation failed", { requestId, details: parseResult.error.flatten() });
          return jsonResponse(
            { error: "Validation failed", details: parseResult.error.flatten() },
            { status: 400, requestId }
          );
        }
        parsedBody = parseResult.data;
      } catch {
        return jsonResponse({ error: "Invalid JSON request body" }, { status: 400, requestId });
      }
    }

    // 4. Delegate to Handler
    try {
      return await handler(req, {
        session,
        userId: session.user.id,
        requestId,
        body: parsedBody,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      logger.error("Unhandled API route error", { requestId, error: message });
      return jsonResponse({ error: message }, { status: 500, requestId });
    }
  };
}
