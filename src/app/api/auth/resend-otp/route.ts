import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { generateOtp, hashOtp, buildVerifyToken } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { checkIpRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`resendotp:${ip}`, 3, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    try {
      user = await getDb().user.findUnique({ where: { email: normalizedEmail } });
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      user = await fallbackStore.findUserByEmail(normalizedEmail);
    }

    if (!user) {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      user = await fallbackStore.findUserByEmail(normalizedEmail);
    }

    if (!user || user.emailVerified) {
      return NextResponse.json({ message: "If the account exists, a code has been sent." });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiry = new Date(Date.now() + 600000);

    try {
      await getDb().user.update({
        where: { id: user.id },
        data: { resetToken: buildVerifyToken(otpHash), resetTokenExpiry: expiry },
      });
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      await fallbackStore.updateUser(
        { email: normalizedEmail },
        { resetToken: buildVerifyToken(otpHash), resetTokenExpiry: expiry }
      );
    }

    const result = await sendOtpEmail(normalizedEmail, otp, "Verify your Prompt+ email", "Here's your new verification code.");
    if (!result.sent) logger.warn("Resend OTP delivery note", { email: normalizedEmail, error: result.error });

    return NextResponse.json({ message: "If the account exists, a code has been sent." });
  } catch (err: unknown) {
    logger.error("Resend OTP endpoint error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ message: "If the account exists, a code has been sent." });
  }
}
