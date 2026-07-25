import { Resend } from "resend";

const from = process.env.SMTP_FROM || "Prompt+ <onboarding@resend.dev>";

export async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL] Resend not configured. Reset link for ${email}: ${resetUrl}`);
    return;
  }
  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your Prompt+ password",
      text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, ignore this email.`,
    });
    if (error) {
      console.error(`[EMAIL] Resend returned error for ${email}:`, error);
    } else {
      console.log(`[EMAIL] Sent to ${email}, id: ${data?.id}`);
    }
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${email}:`, err instanceof Error ? err.message : err);
    console.log(`[EMAIL] Fallback link for ${email}: ${resetUrl}`);
  }
}
