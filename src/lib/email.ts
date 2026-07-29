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

export async function sendResetEmail(email: string, resetUrl: string): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: "Reset your Prompt+ password",
        text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, ignore this email.`,
      });
      return { sent: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown SMTP error";
      logger.error("SMTP send failed", { from, to: email, error: msg });
      return { sent: false, error: msg };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "No email provider configured — set SMTP_HOST or RESEND_API_KEY" };
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
