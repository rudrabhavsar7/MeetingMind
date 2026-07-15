import type { Metadata } from "next";
import ForgotPasswordClient from "./_components/forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
