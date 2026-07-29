import crypto from "crypto";

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function verifyOtp(input: string, hash: string): boolean {
  return hashOtp(input) === hash;
}

const PREFIX_VERIFY = "ev:";
const PREFIX_RESET = "pr:";

export function buildVerifyToken(otpHash: string): string {
  return `${PREFIX_VERIFY}${otpHash}`;
}

export function buildResetToken(otpHash: string): string {
  return `${PREFIX_RESET}${otpHash}`;
}

export function isVerifyToken(token: string): boolean {
  return token.startsWith(PREFIX_VERIFY);
}

export function isResetToken(token: string): boolean {
  return token.startsWith(PREFIX_RESET);
}

export function stripPrefix(token: string): string {
  return token.slice(3);
}
