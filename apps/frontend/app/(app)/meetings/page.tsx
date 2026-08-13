"use client";

import { useState } from "react";
import { Video, Upload, Search, Loader2, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard, MeetingCardSkeleton } from "@/components/meeting/meeting-card";
import { useMeetings } from "@/lib/queries/meetings";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { Meeting, MeetingStatus } from "@/types/api.types";

// ─── Filter options ──────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: MeetingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Processing", value: "analyzing" },
  { label: "Recording", value: "recording" },
  { label: "Failed", value: "failed" },
];

// ─── Meetings Page ────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const workspaceId = user?.workspaces?.[0]?.id ?? "default";
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "all">("all");
  const [search, setSearch] = useState("");

  const {
    data: meetingsData,
    isLoading,
    isError,
    refetch,
  } = useMeetings(
    {
      workspaceId,
      limit: 50,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { enabled: !!workspaceId }
  );

  const meetings: Meeting[] = meetingsData?.data ?? [];

  // Client-side title search (backend keyword search is MM-606 / Rudra's ticket)
  const filtered = search.trim()
    ? meetings.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      )
    : meetings;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Meetings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${filtered.length} meeting${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/meetings/new">
              <Button variant="ghost" size="sm" className="gap-2">
                <Video className="h-4 w-4" />
                Capture
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-6 py-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="meetings-search"
              type="search"
              placeholder="Search meetings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search meetings by title"
            />
          </div>

          {/* Status filter pills */}
          <div
            className="flex items-center gap-1.5 flex-wrap"
            role="group"
            aria-label="Filter meetings by status"
          >
            <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                aria-pressed={statusFilter === value}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  statusFilter === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <MeetingCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <Card className="border-dashed border-destructive/40">
            <CardContent className="py-10 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-destructive/60 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Failed to load meetings from the server.
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                <Loader2 className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            {search ? (
              <>
                <p className="text-base font-medium text-foreground">No results for &ldquo;{search}&rdquo;</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term or clear filters.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-foreground">No meetings yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Capture your first meeting with the Chrome extension.
                </p>
              </>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
