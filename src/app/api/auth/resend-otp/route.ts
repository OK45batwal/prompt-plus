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
    const user = await getDb().user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: "If the account exists, a code has been sent." });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiry = new Date(Date.now() + 600000);

    await getDb().user.update({
      where: { id: user.id },
      data: { resetToken: buildVerifyToken(otpHash), resetTokenExpiry: expiry },
    });

    const result = await sendOtpEmail(email, otp, "Verify your Prompt+ email", "Here's your new verification code.");
    if (!result.sent) logger.error("Resend OTP failed", { email, error: result.error });

    return NextResponse.json({ message: "If the account exists, a code has been sent." });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
