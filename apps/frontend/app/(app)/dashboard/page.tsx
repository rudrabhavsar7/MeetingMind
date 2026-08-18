"use client";

import Link from "next/link";
import {
  CheckSquare,
  Video,
  Clock,
  ArrowRight,
  Puzzle,
  CheckCircle2,
  Calendar,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingCard, MeetingCardSkeleton } from "@/components/meeting/meeting-card";
import { useMeetings } from "@/lib/queries/meetings";
import { useWorkspaceActionItems } from "@/lib/queries/workspace";
import { useAuthStore } from "@/stores/auth-store";
import type { Meeting, ActionItem } from "@/types/api.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  const date = new Date(iso);
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `Due in ${diff}d`;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  // v1: one workspace per deployment — use first workspace or fall back to "default"
  const workspaceId = user?.workspaces?.[0]?.id ?? "default";

  const {
    data: meetingsData,
    isLoading: meetingsLoading,
    isError: meetingsError,
  } = useMeetings(
    { workspaceId, limit: 5 },
    { enabled: !!workspaceId }
  );

  const {
    data: actionsData,
    isLoading: actionsLoading,
  } = useWorkspaceActionItems(
    { workspaceId, status: "open", limit: 10 },
    { enabled: !!workspaceId }
  );

  const meetings: Meeting[] = meetingsData?.data ?? [];
  const actionItems: ActionItem[] = actionsData?.data ?? [];

  const completedThisWeek = meetings.filter((m) => m.status === "completed").length;
  const openActions = actionItems.filter((a) => a.status === "open");

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
              value: actionsLoading ? "—" : openActions.length,
              sub: "assigned to you",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              icon: Video,
              label: "Meetings This Week",
              value: meetingsLoading ? "—" : completedThisWeek,
              sub: "processed successfully",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: Clock,
              label: "Hours Saved",
              value: meetingsLoading
                ? "—"
                : `${Math.round((completedThisWeek * 3600 * 0.7) / 3600)}h`,
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
          {/* Recent Meetings — 3/5 cols */}
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

            {/* Loading */}
            {meetingsLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <MeetingCardSkeleton key={i} />)}
              </div>
            )}

            {/* Error */}
            {meetingsError && !meetingsLoading && (
              <Card className="border-dashed border-destructive/40">
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive/60 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Could not load meetings. Showing cached data.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Empty */}
            {!meetingsLoading && meetings.length === 0 && (
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
            )}

            {/* Data */}
            {!meetingsLoading && meetings.length > 0 && (
              <div className="space-y-3">
                {meetings.slice(0, 5).map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </section>

          {/* My Action Items — 2/5 cols */}
          <section aria-labelledby="action-items-heading" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="action-items-heading" className="text-sm font-semibold text-foreground">
                My Action Items
              </h2>
              <Link
                href="/actions"
                className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                View all
              </Link>
            </div>

            <Card>
              {actionsLoading ? (
                <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </CardContent>
              ) : openActions.length === 0 ? (
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">You&apos;re all caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No open action items assigned to you.
                  </p>
                </CardContent>
              ) : (
                <ul className="divide-y divide-border">
                  {openActions.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 border-border" />
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
