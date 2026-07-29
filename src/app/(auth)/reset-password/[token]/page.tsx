import { redirect } from "next/navigation";

export default function ResetPasswordRedirect() {
  redirect("/forgot-password");
}
