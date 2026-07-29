import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { verifyOtp, stripPrefix, isResetToken } from "@/lib/auth/otp";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { email, otp, password } = parsed.data;

    const user = await getDb().user.findUnique({ where: { email } });

    if (!user || !user.resetToken || !user.resetTokenExpiry || !isResetToken(user.resetToken)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    if (!verifyOtp(otp, stripPrefix(user.resetToken))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await getDb().user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}