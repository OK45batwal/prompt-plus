import { getDb } from "@/lib/db/prisma";

/**
 * Authoritative account check for an already-issued JWT.
 *
 * Clearing a cookie cannot revoke a copied token before it expires, so every
 * protected server operation compares the JWT's `authVersion` with the database.
 * Database failure is a temporary condition: it must not grant access, and it
 * must not be reported as a revoked session either.
 */
export type SessionAccountCheck =
  | {
      ok: true;
      user: { id: string; authVersion: number; emailVerified: Date | null };
    }
  | {
      ok: false;
      status: 401 | 503;
      reason: "unknown-user" | "deleted" | "revoked" | "unavailable";
    };

export async function verifySessionAccount(
  userId: string,
  tokenAuthVersion: unknown
): Promise<SessionAccountCheck> {
  if (!userId) return { ok: false, status: 401, reason: "unknown-user" };

  // Tokens minted before versioning cannot prove they are current.
  if (typeof tokenAuthVersion !== "number" || !Number.isInteger(tokenAuthVersion)) {
    return { ok: false, status: 401, reason: "revoked" };
  }

  let user: {
    id: string;
    authVersion: number;
    emailVerified: Date | null;
    deletedAt: Date | null;
  } | null;

  try {
    user = await getDb().user.findUnique({
      where: { id: userId },
      select: { id: true, authVersion: true, emailVerified: true, deletedAt: true },
    });
  } catch {
    return { ok: false, status: 503, reason: "unavailable" };
  }

  if (!user) return { ok: false, status: 401, reason: "unknown-user" };
  if (user.deletedAt) return { ok: false, status: 401, reason: "deleted" };
  if (user.authVersion !== tokenAuthVersion) return { ok: false, status: 401, reason: "revoked" };

  return { ok: true, user: { id: user.id, authVersion: user.authVersion, emailVerified: user.emailVerified } };
}

export function sessionCheckMessage(check: { reason?: string; status: 401 | 503 }): string {
  if (check.status === 503) return "Account verification is temporarily unavailable. Please retry shortly.";
  if (check.reason === "deleted") return "This account is no longer available.";
  return "Your session is no longer valid. Please sign in again.";
}
