import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db/prisma";
import { sendResetEmail } from "@/lib/email";
import { forgotPasswordSchema, logRejection } from "@/lib/validations/auth";

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
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000);

      await getDb().user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      const resetUrl = `${request.nextUrl.origin}/reset-password/${token}`;
      const result = await sendResetEmail(email, resetUrl);

      if (!result.sent) {
        return NextResponse.json({
          fallback: true,
          resetUrl: token,
          message: "Email service unavailable. Use the direct link below to reset your password.",
        });
      }
    }

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
