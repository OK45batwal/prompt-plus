import bcrypt from "bcrypt";
import { getDb } from "@/lib/db/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withAuth(
  async (req, context) => {
    const { userId, requestId, body } = context;
    const rl = checkRateLimit(userId, 1);
    if (!rl.allowed) {
      return jsonResponse({ error: "Too many attempts. Try again later." }, { status: 429, rateLimit: rl, requestId });
    }

    const { currentPassword, newPassword } = body!;

    const user = await getDb().user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return jsonResponse({ error: "Cannot change password for OAuth-only accounts" }, { status: 400, requestId });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return jsonResponse({ error: "Current password is incorrect" }, { status: 403, requestId });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await getDb().user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return jsonResponse({ message: "Password updated" }, { requestId });
  },
  { schema: changePasswordSchema }
);
