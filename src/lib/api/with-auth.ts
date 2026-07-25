import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { validateCsrf } from "@/lib/auth/csrf";
import { jsonResponse } from "./response-headers";
import { Session } from "next-auth";

export interface AuthApiContext {
  session: Session;
  userId: string;
  requestId: string;
}

export type AuthenticatedRouteHandler = (
  req: NextRequest,
  context: AuthApiContext
) => Promise<Response> | Response;

/**
 * Higher-Order Function wrapper for authenticated API v1 route handlers.
 * Enforces session authentication, CSRF validation on mutating methods, and request ID extraction.
 */
export function withAuth(handler: AuthenticatedRouteHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    // 1. Verify Authentication Session
    const session = await auth();
    if (!session?.user?.id) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401, requestId });
    }

    // 2. Validate CSRF Protection for state-changing HTTP methods
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      return jsonResponse(
        { error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403, requestId }
      );
    }

    // 3. Delegate to Handler
    try {
      return await handler(req, {
        session,
        userId: session.user.id,
        requestId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return jsonResponse({ error: message }, { status: 500, requestId });
    }
  };
}
