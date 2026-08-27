import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { checkIpRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().optional(),
  password: z.string().min(6).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`resetpw:${ip}`, 5, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 12);

    let updatedUser: { id: string; email: string; name: string | null; avatar: string | null } | null = null;

    try {
      const user = await getDb().user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });
      if (user) {
        const dbUser = await getDb().user.update({
          where: { id: user.id },
          data: { passwordHash, emailVerified: new Date(), resetToken: null, resetTokenExpiry: null },
        });
        updatedUser = { id: dbUser.id, email: dbUser.email, name: dbUser.name, avatar: dbUser.avatar };
      }
    } catch {
      const { fallbackStore } = await import("@/lib/db/fallback-store");
      const fbUser = await fallbackStore.findUserByEmail(normalizedEmail);
      if (fbUser) {
        const upd = await fallbackStore.updateUser(
          { email: normalizedEmail },
          { passwordHash, emailVerified: new Date(), resetToken: null, resetTokenExpiry: null }
        );
        updatedUser = { id: upd.id, email: upd.email, name: upd.name, avatar: upd.avatar };
      }
    }

    const response = NextResponse.json({
      success: true,
      redirectUrl: "/dashboard",
      message: "Password updated successfully! Redirecting to dashboard...",
    });

    if (updatedUser) {
      const { attachSessionCookies } = await import("@/lib/auth/session-cookie");
      await attachSessionCookies(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          image: updatedUser.avatar,
        },
        response
      );
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}