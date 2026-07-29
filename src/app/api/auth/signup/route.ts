import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { signupSchema, logRejection } from "@/lib/validations/auth";
import { generateOtp, hashOtp, buildVerifyToken } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("signup", parsed.error);
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await getDb().user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: "Invalid input" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiry = new Date(Date.now() + 600000);

    await getDb().user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        provider: "email",
        resetToken: buildVerifyToken(otpHash),
        resetTokenExpiry: expiry,
      },
    });

    const result = await sendOtpEmail(email, otp, "Verify your Prompt+ email", "Welcome to Prompt+!");

    if (!result.sent) {
      logger.error("Failed to send verification OTP", { email, error: result.error });
    }

    return NextResponse.json(
      { needsVerification: true, email },
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