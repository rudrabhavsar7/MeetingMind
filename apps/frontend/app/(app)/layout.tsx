import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: {
    default: "MeetingMind",
    template: "%s | MeetingMind",
  },
};

/**
 * Shared layout for all authenticated app pages.
 * Renders the sidebar + main content area.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
