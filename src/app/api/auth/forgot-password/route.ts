import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db/prisma";
import { sendResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await getDb().user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.passwordHash) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await getDb().user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      const resetUrl = `${request.nextUrl.origin}/reset-password/${token}`;
      await sendResetEmail(normalizedEmail, resetUrl);
    }

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
