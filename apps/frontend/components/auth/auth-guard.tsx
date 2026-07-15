"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useRef(false);
  const { user, isLoading, hydrateFromSession } = useAuthStore();

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    void hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    if (hydrated.current && !isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  return children;
}
