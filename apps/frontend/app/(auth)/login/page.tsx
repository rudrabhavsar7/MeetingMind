import { Suspense } from "react";
import type { Metadata } from "next";
import LoginClient from "./_components/login-client";

export const metadata: Metadata = {
  title: "Sign In",
};

function LoginFallback() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Loading sign in...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
