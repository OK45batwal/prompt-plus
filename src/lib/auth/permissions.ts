import { Session } from "next-auth";

export type Role = "user" | "admin";

export interface UserPermissionContext {
  userId: string;
  role?: Role;
}

/**
 * Verifies whether a given authenticated user session has permission to access a resource.
 */
export function hasPermission(
  session: Session | null | undefined,
  requiredRole: Role = "user",
  resourceOwnerId?: string
): boolean {
  if (!session?.user?.id) {
    return false;
  }

  // Admin users have full authorization across all resources
  const userRole = (session.user as { role?: string }).role || "user";
  if (userRole === "admin") {
    return true;
  }

  if (requiredRole === "admin" && userRole !== "admin") {
    return false;
  }

  // If a specific resource owner is checked, user must own the resource
  if (resourceOwnerId && session.user.id !== resourceOwnerId) {
    return false;
  }

  return true;
}
