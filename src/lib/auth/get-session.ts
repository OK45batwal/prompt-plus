import { auth } from "@/lib/auth/config";
import type { Session } from "next-auth";

/**
 * Server-side helper to retrieve and validate the current NextAuth session.
 */
export async function getValidatedSession(): Promise<Session | null> {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
