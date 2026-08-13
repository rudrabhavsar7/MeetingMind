"use client";

import { useState, useMemo } from "react";
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
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [localStatus, setLocalStatus] = useState<Record<string, "open" | "completed">>({});
  
  // Basic limit for load more pagination
  const [limit, setLimit] = useState(20);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useWorkspaceActionItems(
    {
      workspaceId,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit,
    },
    { enabled: !!workspaceId }
  );

  const { mutate: patchItem } = usePatchWorkspaceActionItem();

  const items: ActionItem[] = data?.data ?? [];

  const assignees = useMemo(() => {
    const unique = new Set<string>();
    items.forEach(i => {
      if (i.assignee) unique.add(i.assignee);
    });
    return Array.from(unique).sort();
  }, [items]);

  const filtered = items.filter((item) => {
    const effective = localStatus[item.id] ?? item.status;
    if (statusFilter !== "all" && effective !== statusFilter) return false;
    if (assigneeFilter !== "all" && item.assignee !== assigneeFilter) return false;
    return true;
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

      <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Filter action items">
        <div className="flex items-center gap-2">
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
        
        {assignees.length > 0 && (
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-2 py-1 bg-muted rounded-md text-xs border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              aria-label="Filter by assignee"
            >
              <option value="all">All Assignees</option>
              {assignees.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card>
        {isLoading && items.length === 0 ? (
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
              {statusFilter === "open" ? "No open action items matching this filter." : ""}
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
            
            {/* Load More Button */}
            {items.length >= limit && (
              <div className="p-4 flex justify-center border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLimit(l => l + 20)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
