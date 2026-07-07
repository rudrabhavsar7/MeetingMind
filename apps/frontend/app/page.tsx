import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MeetingMind — AI Meeting Intelligence",
};

/**
 * Root page redirects authenticated users to /dashboard.
 * Unauthenticated users will be redirected to /login by middleware (MM-204).
 *
 * For now this is a direct redirect to /dashboard until auth middleware
 * is implemented in MM-204.
 */
export default function HomePage() {
  redirect("/dashboard");
}
