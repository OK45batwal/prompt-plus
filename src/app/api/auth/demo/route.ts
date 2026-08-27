import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/session-cookie";
import { fallbackStore } from "@/lib/db/fallback-store";

export async function POST() {
  try {
    const demoEmail = "developer@promptplus.app";
    let user = await fallbackStore.findUserByEmail(demoEmail);

    if (!user) {
      user = await fallbackStore.createUser({
        email: demoEmail,
        name: "Prompt+ Explorer",
        onboardingCompleted: true,
        emailVerified: new Date(),
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        redirectUrl: "/dashboard",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        },
      },
      { status: 200 }
    );

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
  } catch (error: unknown) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Failed to initialize demo session" }, { status: 500 });
  }
}
