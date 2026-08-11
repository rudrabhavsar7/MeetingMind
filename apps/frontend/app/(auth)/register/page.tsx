import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterClient from "./_components/register-client";

export const metadata: Metadata = {
  title: "Create Account",
};

function RegisterFallback() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Checking registration mode…
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterClient />
    </Suspense>
  );
}