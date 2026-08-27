import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema, logRejection } from "@/lib/validations/auth";
import { checkIpRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkIpRateLimit(`forgot:${ip}`, 3, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("forgot-password", parsed.error);
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      message: "Ready to update your password.",
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
