"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Filter,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useWorkspaceActionItems, usePatchWorkspaceActionItem } from "@/lib/queries/workspace";
import { useAuthStore } from "@/stores/auth-store";
import type { ActionItem } from "@/types/api.types";

// ─── Mock fallback ───────────────────────────────────────────────────────────

const MOCK_ITEMS: ActionItem[] = [
  { id: "a1", meeting_id: "m1", text: "Finalize Q3 OKR document and share with team by Friday", assignee: "Prashant", due_date: new Date(Date.now() + 172800000).toISOString(), status: "open", source_segment_id: null, created_at: new Date().toISOString() },
  { id: "a2", meeting_id: "m2", text: "Set up pgvector extension in staging PostgreSQL", assignee: "Arnish", due_date: new Date(Date.now() + 86400000).toISOString(), status: "open", source_segment_id: null, created_at: new Date().toISOString() },
  { id: "a3", meeting_id: "m1", text: "Jenil to document WebSocket event spec by Thursday", assignee: "Jenil", due_date: new Date(Date.now() - 86400000).toISOString(), status: "open", source_segment_id: "s6", created_at: new Date().toISOString() },
  { id: "a4", meeting_id: "m2", text: "Rudra to define STT provider abstraction interface", assignee: "Rudra", due_date: null, status: "completed", source_segment_id: "s4", created_at: new Date().toISOString() },
  { id: "a5", meeting_id: "m3", text: "Review and approve the updated design tokens in globals.css", assignee: "Prashant", due_date: null, status: "open", source_segment_id: null, created_at: new Date().toISOString() },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(iso: string | null): { label: string; overdue: boolean } {
  if (!iso) return { label: "No due date", overdue: false };
  const date = new Date(iso);
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  if (diff === 1) return { label: "Due tomorrow", overdue: false };
  return { label: `Due in ${diff}d`, overdue: false };
}

// ─── Action Item Row ──────────────────────────────────────────────────────────

function ActionItemRow({
  item,
  localStatus,
  onToggle,
  viewerOnly,
}: {
  item: ActionItem;
  localStatus: "open" | "completed";
  onToggle: () => void;
  viewerOnly: boolean;
}) {
  const done = localStatus === "completed";
  const due = formatDueDate(item.due_date);

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={viewerOnly}
        aria-label={done ? `Mark incomplete: ${item.text}` : `Mark complete: ${item.text}`}
        className={cn(
          "flex-shrink-0 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
          viewerOnly && "cursor-not-allowed opacity-50"
        )}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug text-foreground", done && "line-through text-muted-foreground")}>
          {item.text}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {item.assignee && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <User className="h-3 w-3" />
              {item.assignee}
            </span>
          )}
          {item.due_date && (
            <span className={cn("text-[11px] inline-flex items-center gap-1", due.overdue ? "text-destructive" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" />
              {due.label}
            </span>
          )}
          <Link
            href={`/meetings/${item.meeting_id}`}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
          >
            View meeting <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Status badge */}
      <span className={cn(
        "flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        done
          ? "bg-primary/10 text-primary"
          : due.overdue
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"
      )}>
        {done ? "Done" : due.overdue ? "Overdue" : "Open"}
      </span>
    </div>
  );
}

// ─── Filter types ─────────────────────────────────────────────────────────────

type StatusFilter = "all" | "open" | "completed";

// ─── Actions Client ───────────────────────────────────────────────────────────

export default function ActionsClient() {
  const { user } = useAuthStore();
  const workspaceId = user?.workspaces?.[0]?.id ?? "default";
  const userRole = user?.workspaces?.[0]?.role ?? "member";
  const viewerOnly = userRole === "viewer";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [localStatus, setLocalStatus] = useState<Record<string, "open" | "completed">>({});

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useWorkspaceActionItems(
    {
      workspaceId,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
    },
    { enabled: !!workspaceId }
  );

  const { mutate: patchItem } = usePatchWorkspaceActionItem();

  const items: ActionItem[] = data?.data ?? MOCK_ITEMS;

  // Apply local status overrides + client-side filter
  const filtered = items.filter((item) => {
    const effective = localStatus[item.id] ?? item.status;
    if (statusFilter === "all") return true;
    return effective === statusFilter;
  });

  function handleToggle(item: ActionItem) {
    if (viewerOnly) return;
    const newStatus = (localStatus[item.id] ?? item.status) === "open" ? "completed" : "open";
    setLocalStatus((prev) => ({ ...prev, [item.id]: newStatus }));
    patchItem({ workspaceId, meetingId: item.meeting_id, itemId: item.id, status: newStatus });
  }

  const openCount = items.filter((i) => (localStatus[i.id] ?? i.status) === "open").length;
  const overdueCount = items.filter((i) => {
    const effective = localStatus[i.id] ?? i.status;
    return effective === "open" && i.due_date && new Date(i.due_date) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Open", value: isLoading ? "—" : openCount, color: "text-foreground" },
          { label: "Overdue", value: isLoading ? "—" : overdueCount, color: "text-destructive" },
          { label: "Completed", value: isLoading ? "—" : items.length - openCount, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2" role="group" aria-label="Filter action items">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {(["all", "open", "completed"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            aria-pressed={statusFilter === f}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              statusFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        {isLoading ? (
          <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading action items…
          </CardContent>
        ) : isError ? (
          <CardContent className="py-8 text-center space-y-3">
            <AlertTriangle className="h-7 w-7 text-destructive/60 mx-auto" />
            <p className="text-sm text-muted-foreground">Failed to load action items.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Retry</Button>
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="py-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              {statusFilter === "completed" ? "No completed items yet." : "All caught up!"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter === "open" ? "No open action items in this workspace." : ""}
            </p>
          </CardContent>
        ) : (
          <div>
            {viewerOnly && (
              <div className="px-4 py-2 bg-muted/30 border-b border-border">
                <p className="text-xs text-muted-foreground">You have Viewer access — action items are read-only.</p>
              </div>
            )}
            {filtered.map((item) => (
              <ActionItemRow
                key={item.id}
                item={item}
                localStatus={localStatus[item.id] ?? item.status}
                onToggle={() => handleToggle(item)}
                viewerOnly={viewerOnly}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
