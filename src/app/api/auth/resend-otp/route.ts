import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { generateOtp, hashOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
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
      data: { emailOtp: otpHash, emailOtpExpiry: expiry, emailOtpAttempts: 0 },
    });

    const result = await sendOtpEmail(email, otp, "Verify your Prompt+ email", "Here's your new verification code.");
    if (!result.sent) logger.error("Resend OTP failed", { email, error: result.error });

    return NextResponse.json({ message: "If the account exists, a code has been sent." });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
