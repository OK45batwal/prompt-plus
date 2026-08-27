import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { loginSchema, logRejection } from "@/lib/validations/auth";
import { attachSessionCookies } from "@/lib/auth/session-cookie";
import { checkIpRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`login:${ip}`, 50, 3600000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      logRejection("login", parsed.error);
      return NextResponse.json(
        { error: "Please provide a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Query User from Database with Case-Insensitive Matching
    let user = null;
    try {
      user = await getDb().user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });
      if (!user) {
        user = await getDb().user.findUnique({
          where: { email: normalizedEmail },
        });
      }
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      user = await fallbackStore.findUserByEmail(normalizedEmail);
    }

    if (!user) {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      user = await fallbackStore.findUserByEmail(normalizedEmail);
    }

    // If user does not exist in DB or fallback store, auto-provision account with provided password
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 12);
      try {
        const dbUser = await getDb().user.create({
          data: {
            name: normalizedEmail.split("@")[0],
            email: normalizedEmail,
            passwordHash,
            provider: "email",
            emailVerified: new Date(),
            onboardingCompleted: true,
          },
        });
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatar: dbUser.avatar,
          passwordHash: dbUser.passwordHash,
          emailVerified: dbUser.emailVerified,
        };
      } catch {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        const fbUser = await fallbackStore.createUser({
          name: normalizedEmail.split("@")[0],
          email: normalizedEmail,
          passwordHash,
          provider: "email",
          emailVerified: new Date(),
          onboardingCompleted: true,
        });
        user = {
          id: fbUser.id,
          email: fbUser.email,
          name: fbUser.name,
          avatar: fbUser.avatar,
          passwordHash: fbUser.passwordHash,
          emailVerified: fbUser.emailVerified,
        };
      }
    } else {
      // 2. Validate Password Hash or link password if OAuth account
      if (!user.passwordHash) {
        const passwordHash = await bcrypt.hash(password, 12);
        try {
          await getDb().user.update({
            where: { id: user.id },
            data: { passwordHash, emailVerified: new Date() },
          });
        } catch {
          const { fallbackStore } = await import("@/lib/db/fallback-store");
          await fallbackStore.updateUser({ id: user.id }, { passwordHash, emailVerified: new Date() });
        }
      } else {
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Incorrect password. Please verify your password or use forgot password." },
            { status: 401 }
          );
        }
      }
    }

    // 3. Auto-Verify Email on successful password entry
    try {
      if (!user.emailVerified) {
        await getDb().user.update({
          where: { id: user.id },
          data: { emailVerified: new Date(), resetToken: null },
        }).catch(() => {});
      }

      await getDb().user.update({
        where: { id: user.id },
        data: { updatedAt: new Date(), lastLoginAt: new Date() },
      }).catch(() => {});
    } catch {
      // Local fallback store doesn't strictly need persistent updates
    }

    // 4. Construct Response & Attach NextAuth Session Cookies
    const response = NextResponse.json(
      {
        success: true,
        redirectUrl: "/dashboard",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        },
      },
      { status: 200 }
    );

    await attachSessionCookies(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
      },
      response
    );

    return response;
  } catch (error: unknown) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Login service encountered an unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
