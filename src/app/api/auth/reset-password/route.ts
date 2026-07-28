import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { resetPasswordSchema, logRejection } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("reset-password", parsed.error);
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const user = await getDb().user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await getDb().user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
