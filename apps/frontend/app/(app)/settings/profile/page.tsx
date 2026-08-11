import type { Metadata } from "next";
import ProfileClient from "./_components/profile-client";

export const metadata: Metadata = {
  title: "Profile Settings",
};

export default function ProfileSettingsPage() {
  return <ProfileClient />;
}
