import type { Metadata } from "next";
import { Puzzle } from "lucide-react";
import ExtensionSettingsClient from "./_components/extension-settings-client";

export const metadata: Metadata = { title: "Extension Settings" };

export default function ExtensionSettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Puzzle className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Extension Settings</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your Chrome extension connection and capture preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl w-full px-6 py-6">
        <ExtensionSettingsClient />
      </div>
    </div>
  );
}
