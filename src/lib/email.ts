import { Resend } from "resend";

const from = process.env.SMTP_FROM || "Prompt+ <onboarding@resend.dev>";

export async function sendResetEmail(email: string, resetUrl: string): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "Resend not configured" };
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
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
