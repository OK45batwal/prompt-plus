import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/get-session";

export async function GET() {
  try {
    const session = await getValidatedSession();
    if (!session?.user) {
      return NextResponse.json(null, { status: 200 });
    }
    return NextResponse.json(session, { status: 200 });
  } catch {
    return NextResponse.json(null, { status: 200 });
  }
}
