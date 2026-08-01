import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, AuthenticatedRouteHandler, WithAuthOptions } from "./with-auth";

export const createApiRoute = {
  /**
   * Enforces session authentication, CSRF validation, body schema verification, and request ID tracking.
   */
  authenticated: <T extends z.ZodTypeAny = z.ZodTypeAny>(
    handler: AuthenticatedRouteHandler<z.infer<T>>,
    options?: WithAuthOptions<T>
  ) => {
    return withAuth(handler, options);
  },
};
