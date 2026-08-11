import type { Metadata } from "next";
import { Suspense } from "react";
import InvitationRegisterClient from "./_components/invitation-register-client";

export const metadata: Metadata = {
  title: "Join Workspace",
};

function InvitationRegisterFallback() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Validating invitation…
    </div>
  );
}

export default function InvitationRegisterPage() {
  return (
    <Suspense fallback={<InvitationRegisterFallback />}>
      <InvitationRegisterClient />
    </Suspense>
  );
}