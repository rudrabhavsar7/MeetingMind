import type { Metadata } from "next";
import WorkspaceSettingsClient from "./_components/workspace-settings-client";

export const metadata: Metadata = {
  title: "Workspace Settings",
};

export default function WorkspaceSettingsPage() {
  return <WorkspaceSettingsClient />;
}
