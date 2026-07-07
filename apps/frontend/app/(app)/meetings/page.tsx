import type { Metadata } from "next";
import { Video, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/meeting/meeting-card";
import type { Meeting } from "@/types/api.types";

export const metadata: Metadata = { title: "Meetings" };

const mockMeetings: Meeting[] = [
  {
    id: "m1",
    workspace_id: "ws1",
    title: "Q3 Product Planning — All Hands",
    status: "completed",
    source_app: "Google Meet",
    source_url: null,
    duration_seconds: 5400,
    participant_count: 12,
    started_at: new Date(Date.now() - 86400000).toISOString(),
    ended_at: new Date(Date.now() - 80600000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    summary_preview: "Discussed Q3 roadmap priorities, budget allocation for the AI pipeline, and team OKRs.",
  },
  {
    id: "m2",
    workspace_id: "ws1",
    title: "Backend Architecture Review",
    status: "completed",
    source_app: "Google Meet",
    source_url: null,
    duration_seconds: 3600,
    participant_count: 5,
    started_at: new Date(Date.now() - 172800000).toISOString(),
    ended_at: new Date(Date.now() - 169200000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    summary_preview: "Reviewed the FastAPI + Celery architecture. Agreed to use pgvector and Redis pub-sub.",
  },
  {
    id: "m3",
    workspace_id: "ws1",
    title: "Design System Sprint Review",
    status: "analyzing",
    source_app: "Google Meet",
    source_url: null,
    duration_seconds: 2700,
    participant_count: 4,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    ended_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    summary_preview: null,
  },
  {
    id: "m4",
    workspace_id: "ws1",
    title: "1:1 Weekly — Engineering Sync",
    status: "completed",
    source_app: "Google Meet",
    source_url: null,
    duration_seconds: 1800,
    participant_count: 2,
    started_at: new Date(Date.now() - 259200000).toISOString(),
    ended_at: new Date(Date.now() - 257400000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    summary_preview: "Discussed sprint progress, blockers on the auth flow, and upcoming PTO.",
  },
];

export default function MeetingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Meetings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{mockMeetings.length} meetings</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Recording
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-6 py-6">
        {mockMeetings.length === 0 ? (
          <div className="text-center py-24">
            <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-base font-medium text-foreground">No meetings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Capture your first meeting with the Chrome extension.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockMeetings.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
