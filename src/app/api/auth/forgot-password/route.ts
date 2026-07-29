import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { sendOtpEmail } from "@/lib/email";
import { forgotPasswordSchema, logRejection } from "@/lib/validations/auth";
import { generateOtp, hashOtp, buildResetToken } from "@/lib/auth/otp";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("forgot-password", parsed.error);
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await getDb().user.findUnique({ where: { email } });

    if (user && user.passwordHash) {
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiry = new Date(Date.now() + 600000);

      await getDb().user.update({
        where: { id: user.id },
        data: { resetToken: buildResetToken(otpHash), resetTokenExpiry: expiry },
      });

      const result = await sendOtpEmail(email, otp, "Reset your Prompt+ password", "You requested a password reset.");
      if (!result.sent) {
        logger.error("Failed to send reset OTP", { email, error: result.error });
      }
    }

    return NextResponse.json({ message: "If an account with that email exists, a code has been sent." });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
