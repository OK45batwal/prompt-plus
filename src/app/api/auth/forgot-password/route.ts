import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { sendOtpEmail } from "@/lib/email";
import { forgotPasswordSchema, logRejection } from "@/lib/validations/auth";
import { generateOtp, hashOtp, buildResetToken } from "@/lib/auth/otp";
import { logger } from "@/lib/logger";
import { checkIpRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`forgot:${ip}`, 3, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("forgot-password", parsed.error);
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let isFallback = false;
    try {
      user = await getDb().user.findUnique({ where: { email: normalizedEmail } });
    } catch {
      try {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        user = await fallbackStore.findUserByEmail(normalizedEmail);
        isFallback = true;
      } catch {
        user = null;
      }
    }

    if (!user && !isFallback) {
      try {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        user = await fallbackStore.findUserByEmail(normalizedEmail);
        if (user) isFallback = true;
      } catch {
        user = null;
      }
    }

    if (user && user.passwordHash) {
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiry = new Date(Date.now() + 600000);

      if (isFallback) {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        await fallbackStore.updateUser(
          { email: normalizedEmail },
          { resetToken: buildResetToken(otpHash), resetTokenExpiry: expiry }
        );
      } else {
        await getDb().user.update({
          where: { id: user.id },
          data: { resetToken: buildResetToken(otpHash), resetTokenExpiry: expiry },
        });
      }

      const result = await sendOtpEmail(normalizedEmail, otp, "Reset your Prompt+ password", "You requested a password reset.");
      if (!result.sent) {
        logger.error("Failed to send reset OTP", { email: normalizedEmail, error: result.error });
      }
    }

    return NextResponse.json({ message: "If an account with that email exists, a code has been sent." });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
