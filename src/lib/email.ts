import nodemailer from "nodemailer";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

const from = process.env.SMTP_FROM || "Prompt+ <promptplus2@gmail.com>";

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prompt-plus-three.vercel.app";

function otpHtml(otp: string, intro: string, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td align="center" style="padding:40px 32px 0;">
              <img src="${siteUrl}/prompt-plus-logo.png" alt="Prompt+" width="56" height="56" style="border-radius:12px;display:block;">
              <h1 style="margin:20px 0 8px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${subject}</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.5;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <div style="background:#f3f4f6;border-radius:8px;padding:20px 32px;margin-bottom:16px;">
                <p style="margin:0 0 4px;font-size:12px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Verification Code</p>
                <p style="margin:0;font-size:32px;font-weight:800;color:#3b82f6;letter-spacing:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${otp}</p>
              </div>
              <p style="margin:0 0 32px;font-size:12px;color:#9ca3af;">This code expires in <strong style="color:#6b7280;">10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;border-bottom:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#9ca3af;line-height:1.5;">
                    Need help? <a href="${siteUrl}/contact" style="color:#3b82f6;text-decoration:none;">Contact support</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Prompt+. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(
  email: string,
  otp: string,
  subject: string,
  intro: string,
): Promise<{ sent: boolean; error?: string }> {
  const text = `${intro}\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`;
  const html = otpHtml(otp, intro, subject);
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({ from, to: email, subject, text, html });
      return { sent: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown SMTP error";
      logger.error("SMTP OTP send failed", { to: email, error: msg });
      return { sent: false, error: msg };
    }
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "No email provider configured" };
  const resend = new Resend(apiKey);
  try {
    const sendPromise = resend.emails.send({
      from: from.includes("gmail.com") ? "Prompt+ <onboarding@resend.dev>" : from,
      to: email,
      subject,
      text,
      html,
    });

    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ error: { message: "Email delivery timed out" } }), 3500)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);
    if ("error" in result && result.error) {
      logger.warn("Resend email delivery note", { to: email, error: result.error.message });
      return { sent: false, error: result.error.message };
    }
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Resend error";
    logger.error("Resend OTP send failed", { to: email, error: msg });
    return { sent: false, error: msg };
  }
}
