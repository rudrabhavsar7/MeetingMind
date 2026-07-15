import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./_components/reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
};

function ResetPasswordFallback() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Loading password reset...
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
