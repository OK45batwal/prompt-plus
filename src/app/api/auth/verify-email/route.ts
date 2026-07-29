import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { verifyOtp, stripPrefix, isVerifyToken } from "@/lib/auth/otp";

const schema = z.object({ email: z.string().email(), otp: z.string().length(6) });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { email, otp } = parsed.data;
    const user = await getDb().user.findUnique({ where: { email } });

    if (!user || !user.resetToken || !user.resetTokenExpiry || !isVerifyToken(user.resetToken)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    if (new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    if (!verifyOtp(otp, stripPrefix(user.resetToken))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    await getDb().user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null },
    });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
