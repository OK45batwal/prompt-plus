import { getDb } from "@/lib/db/prisma";

export type OAuthProfile = {
  email?: string | null;
  email_verified?: boolean;
  name?: string | null;
  picture?: string | null;
  avatar_url?: string | null;
};

export type OAuthLinkResult =
  | { ok: true; user: { id: string; authVersion: number; emailVerified: Date | null } }
  | { ok: false; reason: "email-unverified" | "email-in-use" | "unavailable" };

/**
 * Resolve a provider profile to a canonical database user before a JWT is issued.
 *
 * Without an Auth.js adapter the JWT would otherwise carry the provider's own id,
 * which is not a Prompt+ user id. An existing Prompt+ account is only linked when
 * the provider vouches for the address, so a provider profile cannot take over an
 * account that was created with a password.
 */
export async function resolveOAuthUser(
  provider: string,
  providerAccountId: string,
  profile: OAuthProfile
): Promise<OAuthLinkResult> {
  const db = getDb();
  const email = (profile.email || "").toLowerCase().trim();
  if (!email) return { ok: false, reason: "email-unverified" };

  try {
    const linked = await db.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: {
        user: { select: { id: true, authVersion: true, emailVerified: true, deletedAt: true } },
      },
    });
    if (linked) {
      if (linked.user.deletedAt) return { ok: false, reason: "email-in-use" };
      return { ok: true, user: linked.user };
    }

    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, authVersion: true, emailVerified: true, deletedAt: true },
    });

    const verified = profile.email_verified === true;

    if (existing) {
      if (!verified || existing.deletedAt) return { ok: false, reason: "email-in-use" };
      await db.account.create({
        data: { userId: existing.id, type: "oauth", provider, providerAccountId },
      });
      return { ok: true, user: existing };
    }

    const created = await db.user.create({
      data: {
        email,
        name: profile.name || null,
        avatar: profile.picture || profile.avatar_url || null,
        provider,
        providerId: providerAccountId,
        emailVerified: verified ? new Date() : null,
        accounts: { create: { type: "oauth", provider, providerAccountId } },
      },
      select: { id: true, authVersion: true, emailVerified: true },
    });
    return { ok: true, user: created };
  } catch (error) {
    // Two first-time sign-ins can race on the same identity; the second one reads it.
    if ((error as { code?: string })?.code === "P2002") {
      try {
        const linked = await db.account.findUnique({
          where: { provider_providerAccountId: { provider, providerAccountId } },
          include: { user: { select: { id: true, authVersion: true, emailVerified: true } } },
        });
        if (linked) return { ok: true, user: linked.user };
      } catch {
        /* fall through to unavailable */
      }
    }
    return { ok: false, reason: "unavailable" };
  }
}
