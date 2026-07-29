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

export async function sendOtpEmail(
  email: string,
  otp: string,
  subject: string,
  intro: string,
): Promise<{ sent: boolean; error?: string }> {
  const text = `${intro}\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`;
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({ from, to: email, subject, text });
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
    const { error } = await resend.emails.send({ from, to: email, subject, text });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
