import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckSquare,
  Video,
  Clock,
  ArrowRight,
  Puzzle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingCard } from "@/components/meeting/meeting-card";
import type { Meeting, ActionItem } from "@/types/api.types";

export const metadata: Metadata = {
  title: "Dashboard",
};

// ─── Mock data (replaced by TanStack Query fetching in MM-501 integration) ───

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
    ended_at: new Date(Date.now() - 86400000 + 5400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    summary_preview:
      "Discussed Q3 roadmap priorities, budget allocation for the AI pipeline, and team OKRs. Three major decisions logged.",
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
    ended_at: new Date(Date.now() - 172800000 + 3600000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    summary_preview:
      "Reviewed the FastAPI + Celery architecture proposal. Agreed to use pgvector for embeddings and Redis for pub-sub.",
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
];

const mockActionItems: ActionItem[] = [
  {
    id: "a1",
    meeting_id: "m1",
    text: "Finalize Q3 OKR document and share with team by Friday",
    assignee: "Prashant",
    due_date: new Date(Date.now() + 172800000).toISOString(),
    status: "open",
    source_segment_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "a2",
    meeting_id: "m2",
    text: "Set up pgvector extension in staging PostgreSQL",
    assignee: "Prashant",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    status: "open",
    source_segment_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "a3",
    meeting_id: "m1",
    text: "Review and approve the updated design tokens in globals.css",
    assignee: "Prashant",
    due_date: null,
    status: "open",
    source_segment_id: null,
    created_at: new Date().toISOString(),
  },
];

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  const date = new Date(iso);
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `Due in ${diff}d`;
}

export default function DashboardPage() {
  const completedThisWeek = mockMeetings.filter(
    (m) => m.status === "completed"
  ).length;

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Link href="/settings/extension">
            <Button variant="outline" size="sm" className="gap-2">
              <Puzzle className="h-4 w-4" />
              Connect Extension
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-6 py-6 flex-1">
        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: CheckSquare,
              label: "Action Items Due Soon",
              value: mockActionItems.length,
              sub: "assigned to you",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              icon: Video,
              label: "Meetings This Week",
              value: completedThisWeek,
              sub: "processed successfully",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: Clock,
              label: "Hours Saved",
              value: `${Math.round((completedThisWeek * 3600 * 0.7) / 3600)}h`,
              sub: "via AI summarization",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <Card key={label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid: Meetings (60%) + Action Items (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Meetings — 60% (3 of 5 cols) */}
          <section aria-labelledby="recent-meetings-heading" className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="recent-meetings-heading" className="text-sm font-semibold text-foreground">
                Recent Meetings
              </h2>
              <Link
                href="/meetings"
                className="text-xs text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {mockMeetings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No meetings captured yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Connect the Chrome extension to start capturing your meetings.
                  </p>
                  <Link href="/settings/extension">
                    <Button size="sm" className="gap-2">
                      <Puzzle className="h-4 w-4" />
                      Connect Extension
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {mockMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </section>

          {/* My Action Items — 40% (2 of 5 cols) */}
          <section aria-labelledby="action-items-heading" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="action-items-heading" className="text-sm font-semibold text-foreground">
                My Action Items
              </h2>
              <span className="text-xs text-muted-foreground">
                {mockActionItems.filter((a) => a.status === "open").length} open
              </span>
            </div>

            <Card>
              {mockActionItems.length === 0 ? (
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">You&apos;re all caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No open action items assigned to you.
                  </p>
                </CardContent>
              ) : (
                <ul className="divide-y divide-border">
                  {mockActionItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <button
                        aria-label={`Mark complete: ${item.text}`}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 border-border hover:border-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.due_date && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDueDate(item.due_date)}
                            </span>
                          )}
                          <Link
                            href={`/meetings/${item.meeting_id}`}
                            className="text-[11px] text-primary hover:underline"
                          >
                            View meeting →
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
