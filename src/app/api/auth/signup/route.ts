import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/prisma";
import { signupSchema, logRejection } from "@/lib/validations/auth";
import { generateOtp, hashOtp, buildVerifyToken } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { checkIpRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`signup:${ip}`, 3, 3600000);
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
      try {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        existingUser = await fallbackStore.findUserByEmail(normalizedEmail);
      } catch {
        existingUser = null;
      }
    }

    if (existingUser) {
      return NextResponse.json({ error: "Invalid input" }, { status: 409 });
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
        resetToken: buildVerifyToken(otpHash),
        resetTokenExpiry: expiry,
      });
    }

    const result = await sendOtpEmail(normalizedEmail, otp, "Verify your Prompt+ email", "Welcome to Prompt+!");

    if (!result.sent) {
      logger.error("Failed to send verification OTP", { email: normalizedEmail, error: result.error });
    }

    return NextResponse.json(
      { needsVerification: true, email: normalizedEmail },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during signup" },
      { status: 500 }
    );
  }
}