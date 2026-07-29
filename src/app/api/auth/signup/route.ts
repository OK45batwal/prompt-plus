import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { signupSchema, logRejection } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      logRejection("signup", parsed.error);
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await getDb().user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await getDb().user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        provider: "email",
      },
    });

    return NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during signup" },
      { status: 500 }
    );
  }
}