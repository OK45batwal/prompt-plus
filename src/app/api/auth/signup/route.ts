import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { signupSchema, logRejection } from "@/lib/validations/auth";
import { generateOtp, hashOtp, buildVerifyToken } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
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
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiry = new Date(Date.now() + 600000);

    try {
      await getDb().user.create({
        data: {
          name: name || null,
          email: normalizedEmail,
          passwordHash,
          provider: "email",
          emailVerified: null,
          resetToken: buildVerifyToken(otpHash),
          resetTokenExpiry: expiry,
        },
      });
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      await fallbackStore.createUser({
        name: name || null,
        email: normalizedEmail,
        passwordHash,
        provider: "email",
        emailVerified: null,
        resetToken: buildVerifyToken(otpHash),
        resetTokenExpiry: expiry,
      });
    }

    const result = await sendOtpEmail(
      normalizedEmail,
      otp,
      "Verify your Prompt+ email",
      "Welcome to Prompt+! Please enter the 6-digit verification code below to activate your account."
    ).catch((err) => ({ sent: false, error: err instanceof Error ? err.message : "Email error" }));

    if (!result.sent) {
      logger.error("Failed to send verification OTP", { email: normalizedEmail, error: result.error });
    }

    return NextResponse.json(
      {
        success: true,
        needsVerification: true,
        email: normalizedEmail,
        message: "Verification code sent to your email.",
      },
      { status: 201 }
    );
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