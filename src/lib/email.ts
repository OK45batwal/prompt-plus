import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }
  return null;
}

const from = process.env.SMTP_FROM || "noreply@prompt-plus.app";

export async function sendResetEmail(email: string, resetUrl: string) {
  const transport = getTransport();
  if (!transport) {
    console.log(`\n[EMAIL] SMTP not configured. Reset link for ${email}: ${resetUrl}\n`);
    return;
  }
  await transport.sendMail({
    from,
    to: email,
    subject: "Reset your Prompt+ password",
    text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, ignore this email.`,
    html: `<p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p><p>If you didn't request a password reset, ignore this email.</p>`,
  });
}
