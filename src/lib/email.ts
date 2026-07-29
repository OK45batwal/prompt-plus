import { Resend } from "resend";
import { logger } from "@/lib/logger";

const from = process.env.SMTP_FROM || "Prompt+ <onboarding@resend.dev>";

export async function sendResetEmail(email: string, resetUrl: string): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("Resend API key not configured");
    return { sent: false, error: "Resend not configured" };
  }

  if (from.includes("@resend.dev") && !email.includes("resend.dev")) {
    logger.warn("Resend test domain in use — sending to non-test email will fail. Set SMTP_FROM to a verified domain.");
  }

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your Prompt+ password",
      text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, ignore this email.`,
    });
    if (error) {
      logger.error("Resend send failed", { from, to: email, error: error.message });
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Resend send threw", { from, to: email, error: msg });
    return { sent: false, error: msg };
  }
}
