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

    // 1. Query User from Database
    const user = await getDb().user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please check your spelling or sign up." },
        { status: 404 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses OAuth (Google or GitHub). Please sign in using the provider buttons." },
        { status: 400 }
      );
    }

    // 2. Validate Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again or use forgot password." },
        { status: 401 }
      );
    }

    // 3. Auto-Verify Email on successful password entry
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
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
