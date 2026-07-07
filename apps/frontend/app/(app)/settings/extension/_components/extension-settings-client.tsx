"use client";

import { useState } from "react";
import {
  Puzzle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "disconnected" | "pending";

const workspaces = [
  { id: "ws1", name: "MeetingMind Engineering" },
  { id: "ws2", name: "Product Team" },
];

export default function ExtensionSettingsClient() {
  const [status] = useState<ConnectionStatus>("disconnected");
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0].id);
  const [retainAudio] = useState(false);

  const isConnected = status === "connected";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Puzzle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Chrome Extension</CardTitle>
                <CardDescription>MeetingMind Capture for Chrome</CardDescription>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                isConnected
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isConnected ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Extension is connected</p>
              <p className="text-xs text-muted-foreground">
                Open the MeetingMind extension in Chrome to start capturing meetings.
              </p>
              <Button variant="outline" size="sm" className="gap-2 mt-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Open Extension
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm text-foreground font-medium">Get started in 2 steps</p>
                <ol className="space-y-2 text-sm text-muted-foreground list-none">
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</span>
                    <span>Install the MeetingMind Chrome Extension from the Chrome Web Store.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</span>
                    <span>Click the extension icon in Chrome and sign in with your MeetingMind account.</span>
                  </li>
                </ol>
              </div>
              <Button className="gap-2 w-full sm:w-auto">
                <ExternalLink className="h-4 w-4" />
                Install Chrome Extension
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Workspace</CardTitle>
          <CardDescription>
            New captures will be saved to this workspace automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <select
              id="default-workspace"
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Select default workspace"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button size="sm" className="mt-3">
            Save
          </Button>
        </CardContent>
      </Card>

      {/* Audio Retention Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Raw Audio Retention</CardTitle>
          </div>
          <CardDescription>
            Workspace-level policy set by your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "rounded-lg border p-4 flex items-start gap-3",
            retainAudio ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-muted/20"
          )}>
            <Info className={cn("h-4 w-4 flex-shrink-0 mt-0.5", retainAudio ? "text-amber-500" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {retainAudio ? "Raw audio is retained" : "Raw audio is not retained"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {retainAudio
                  ? "Captured audio files are stored securely on your infrastructure for the configured retention period."
                  : "Only transcripts and AI-generated insights are stored. Raw audio is discarded immediately after transcription."}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            To change this policy, contact your workspace administrator or visit{" "}
            <a href="/settings/workspace" className="text-primary hover:underline">
              Workspace Settings
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Supported Meeting Apps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Meeting Apps</CardTitle>
          <CardDescription>Apps the extension can detect and capture.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {[
              { name: "Google Meet", status: "Supported", badge: "bg-primary/10 text-primary" },
              { name: "Zoom Web", status: "Coming soon", badge: "bg-muted text-muted-foreground" },
              { name: "Microsoft Teams Web", status: "Coming soon", badge: "bg-muted text-muted-foreground" },
            ].map(({ name, status: s, badge }) => (
              <li key={name} className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">{name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", badge)}>
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
