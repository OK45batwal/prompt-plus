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
