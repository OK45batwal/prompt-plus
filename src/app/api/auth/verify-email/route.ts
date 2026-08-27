import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { verifyOtp, stripPrefix, isVerifyToken } from "@/lib/auth/otp";
import { checkIpRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email(), otp: z.string().length(6) });

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`verify:${ip}`, 5, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { email, otp } = parsed.data;
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

    try {
      await getDb().user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null },
      });
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      await fallbackStore.updateUser(
        { email: normalizedEmail },
        { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully",
      redirectUrl: "/dashboard",
    });

    const { attachSessionCookies } = await import("@/lib/auth/session-cookie");
    await attachSessionCookies(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
      },
      response
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
