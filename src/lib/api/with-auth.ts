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

    // 1. Verify Authentication Session or Developer API Key
    let session = await auth();
    let userId = session?.user?.id;

    if (!userId) {
      const authHeader = req.headers.get("authorization") || req.headers.get("x-promptplus-api-key");
      if (authHeader) {
        const submittedKey = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (submittedKey.startsWith("pp_live_")) {
          try {
            const { getDb } = await import("@/lib/db/prisma");
            const { decrypt } = await import("@/lib/crypto");
            const activeKeys = await getDb().apiKey.findMany({
              where: { isActive: true },
            });
            for (const keyRow of activeKeys) {
              try {
                const decryptedStoredKey = decrypt(keyRow.apiKeyEnc);
                if (decryptedStoredKey === submittedKey) {
                  userId = keyRow.userId;
                  const userObj = await getDb().user.findUnique({
                    where: { id: userId },
                    select: { email: true },
                  });
                  session = {
                    user: { id: userId, email: userObj?.email || "developer@promptplus.app" },
                    expires: new Date(Date.now() + 86400000).toISOString(),
                  } as Session;
                  break;
                }
              } catch {
                // Ignore decrypt error for unmatching key row
              }
            }
          } catch {
            // ignore DB error
          }
        }
      }
    }

    if (!userId || !session) {
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

    // 3. Optional Payload Validation using cloned request stream
    let parsedBody: z.infer<T> | undefined;
    if (options?.schema && ["POST", "PUT", "PATCH"].includes(req.method)) {
      try {
        const clonedReq = req.clone();
        const rawJson = await clonedReq.json();
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
        userId,
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
