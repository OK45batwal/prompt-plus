import { NextRequest } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth/config";
import { verifySessionAccount, sessionCheckMessage } from "@/lib/auth/account";
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
 * Higher-Order Function wrapper for API v1 route handlers.
 * Enforces session authentication, CSRF validation on mutating methods,
 * request ID extraction, body stream preservation, and structured logging.
 */
export function withAuth<T extends z.ZodTypeAny = z.ZodTypeAny>(
  handler: AuthenticatedRouteHandler<z.infer<T>>,
  options?: WithAuthOptions<T>
) {
  return async (req: NextRequest): Promise<Response> => {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    // 1. Verify Authentication Session
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId || !session) {
      logger.warn("Unauthorized API access attempt", { requestId, path: req.nextUrl?.pathname });
      return jsonResponse({ error: "Unauthorized" }, { status: 401, requestId });
    }

    // 2. Validate CSRF Protection for state-changing HTTP methods. This runs before any
    //    database work so forged requests are rejected without a round trip.
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      logger.warn("CSRF validation failed", { requestId, reason: csrfCheck.reason });
      return jsonResponse(
        { error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403, requestId }
      );
    }

    // 3. Authoritative account check: deleted users and revoked JWT versions stop
    //    here even while the cookie is still cryptographically valid.
    const account = await verifySessionAccount(userId, session.user?.authVersion);
    if (!account.ok) {
      logger.warn("Session rejected by account check", {
        requestId,
        reason: account.reason,
        path: req.nextUrl?.pathname,
      });
      return jsonResponse(
        { error: sessionCheckMessage(account), code: account.reason },
        { status: account.status, requestId }
      );
    }

    // 4. Payload handling. Mutating requests are read exactly once so malformed
    //    JSON is a 400 here instead of a 500 from the handler. An empty body is
    //    allowed when the route does not require a schema (e.g. a clone action).
    let parsedBody: z.infer<T> | undefined;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const raw = await req.clone().text();
      let json: unknown;
      if (raw.trim()) {
        try {
          json = JSON.parse(raw);
        } catch {
          return jsonResponse({ error: "Invalid JSON request body" }, { status: 400, requestId });
        }
      }
      if (options?.schema) {
        const parseResult = options.schema.safeParse(json);
        if (!parseResult.success) {
          logger.warn("Request body validation failed", { requestId, details: parseResult.error.flatten() });
          return jsonResponse(
            { error: "Validation failed", details: parseResult.error.flatten() },
            { status: 400, requestId }
          );
        }
        parsedBody = parseResult.data;
      }
    }

    // 5. Delegate to Handler
    try {
      return await handler(req, {
        session,
        userId,
        requestId,
        body: parsedBody,
      });
    } catch (err: unknown) {
      // Log the detail, never return it: error strings can carry schema, host and credential hints.
      logger.error("Unhandled API route error", { requestId, error: err instanceof Error ? err.message : String(err) });
      return jsonResponse({ error: "Something went wrong on our side. Please retry.", requestId }, { status: 500, requestId });
    }
  };
}
