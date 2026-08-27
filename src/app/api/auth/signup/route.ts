import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { signupSchema, logRejection } from "@/lib/validations/auth";
import { checkIpRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`signup:${ip}`, 100, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("signup", parsed.error);
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    let existingUser = null;
    try {
      existingUser = await getDb().user.findUnique({ where: { email: normalizedEmail } });
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      existingUser = await fallbackStore.findUserByEmail(normalizedEmail);
    }

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let createdUser: { id: string; email: string; name: string | null; avatar: string | null } | null = null;

    try {
      const dbUser = await getDb().user.create({
        data: {
          name: name || null,
          email: normalizedEmail,
          passwordHash,
          provider: "email",
          emailVerified: new Date(),
          onboardingCompleted: true,
        },
      });
      createdUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
      };
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      const fbUser = await fallbackStore.createUser({
        name: name || null,
        email: normalizedEmail,
        passwordHash,
        provider: "email",
        emailVerified: new Date(),
        onboardingCompleted: true,
      });
      createdUser = {
        id: fbUser.id,
        email: fbUser.email,
        name: fbUser.name,
        avatar: fbUser.avatar,
      };
    }

    // Construct response & attach session cookies
    const response = NextResponse.json(
      {
        success: true,
        redirectUrl: "/dashboard",
        email: normalizedEmail,
        message: "Account created successfully! Redirecting to dashboard...",
      },
      { status: 201 }
    );

    if (createdUser) {
      const { attachSessionCookies } = await import("@/lib/auth/session-cookie");
      await attachSessionCookies(
        {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          image: createdUser.avatar,
        },
        response
      );
    }

    return response;
  } catch (error: unknown) {
    console.error("Signup error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes("fetch failed") ||
      msg.includes("connect") ||
      msg.includes("P1001") ||
      msg.includes("database") ||
      msg.includes("Neon")
    ) {
      return NextResponse.json(
        {
          error:
            "Database unreachable. Please ensure your PostgreSQL DATABASE_URL is set in Vercel Environment Variables.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Signup service error. Please try again." },
      { status: 500 }
    );
  }
}