import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { changePasswordSchema, logRejection } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    logRejection("change-password", parsed.error, { userId: session.user.id });
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await getDb().user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Cannot change password for OAuth-only accounts" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await getDb().user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ message: "Password updated" });
}