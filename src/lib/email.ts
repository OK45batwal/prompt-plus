import { Resend } from "resend";

const from = process.env.SMTP_FROM || "Prompt+ <onboarding@resend.dev>";

export async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[EMAIL] Resend not configured. Reset link for ${email}: ${resetUrl}\n`);
    return;
  }
  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: "Reset your Prompt+ password",
      text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, ignore this email.`,
    });
    console.log(`[EMAIL] Reset link sent to ${email}`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${email}:`, err instanceof Error ? err.message : err);
    console.log(`\n[EMAIL] Fallback — reset link for ${email}: ${resetUrl}\n`);
  }
}
