import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await getDb().user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
