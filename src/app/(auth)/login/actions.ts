"use server";

import { signIn } from "@/lib/auth/config";
import { AuthError } from "next-auth";

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password. Please verify your credentials or create a new account.";
        default:
          return "Authentication failed. Please verify your credentials.";
      }
    }

    // Rethrow Next.js redirect exceptions so the router can navigate
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Authenticate Server Action error:", error);
    return "Login error. Please check your credentials or register an account.";
  }
}
