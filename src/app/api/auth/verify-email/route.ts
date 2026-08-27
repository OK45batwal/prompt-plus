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
    let isFallback = false;
    try {
      user = await getDb().user.findUnique({ where: { email: normalizedEmail } });
    } catch {
      try {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        user = await fallbackStore.findUserByEmail(normalizedEmail);
        isFallback = true;
      } catch {
        user = null;
      }
    }

    if (!user && !isFallback) {
      try {
        const { fallbackStore } = await import("@/lib/db/fallback-store");
        user = await fallbackStore.findUserByEmail(normalizedEmail);
        if (user) isFallback = true;
      } catch {
        user = null;
      }
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

    if (isFallback) {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      await fallbackStore.updateUser(
        { email: normalizedEmail },
        { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null }
      );
    } else {
      await getDb().user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null },
      });
    }

    return NextResponse.json({ message: "Email verified successfully" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
