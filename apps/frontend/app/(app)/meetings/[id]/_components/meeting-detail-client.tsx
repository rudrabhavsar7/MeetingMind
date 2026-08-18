"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  ChevronRight,
  Lightbulb,
  ListChecks,
  Gavel,
  Play,
  Loader2,
  Search,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMeeting, useTranscriptSegments, useActionItems, useDecisions, usePatchActionItem, useSummaryVersions, useRegenerateSummary } from "@/lib/queries/meetings";
import { useAuthStore } from "@/stores/auth-store";
import type { TranscriptSegment, ActionItem, SummaryVersion } from "@/types/api.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const SPEAKER_COLORS: Record<string, string> = {
  "Speaker 1": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Speaker 2": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "Speaker 3": "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "Speaker 4": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

function speakerColor(label: string): string {
  return SPEAKER_COLORS[label] ?? "bg-muted text-muted-foreground";
}

type InsightsTab = "summary" | "decisions" | "actions";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MeetingDetailClient() {
  const params = useParams<{ id: string }>();
  const meetingId = params?.id;
  const { user } = useAuthStore();
  const workspaceId = user?.workspaces?.[0]?.id ?? "default";

  const [activeTab, setActiveTab] = useState<InsightsTab>("summary");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId, workspaceId);
  const { data: segments, isLoading: segmentsLoading } = useTranscriptSegments(meetingId);
  const { data: actionItems, isLoading: actionsLoading } = useActionItems(meetingId);
  const { data: decisions, isLoading: decisionsLoading } = useDecisions(meetingId);
  const { data: summaryVersions, isLoading: summariesLoading } = useSummaryVersions(meetingId);
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateSummary();

  const displaySegments = segments ?? [];
  const displayActions = actionItems ?? [];
  const displayDecisions = decisions ?? [];

  // Find the current (latest) summary version
  const currentSummary: SummaryVersion | undefined = summaryVersions?.find((v) => v.status === "current") ?? summaryVersions?.[0];
  const displaySummary = currentSummary?.executive_summary ?? meeting?.summary_preview ?? "";
  const displayKeyPoints = currentSummary?.key_points ?? [];

  const { mutate: patchItem } = usePatchActionItem();

  function toggleActionItem(item: ActionItem) {
    const newStatus = item.status === "open" ? "completed" : "open";
    if (meetingId) {
      patchItem({ meetingId, itemId: item.id, status: newStatus });
    }
  }

  const filteredSegments = transcriptSearch.trim()
    ? displaySegments.filter(
        (s) =>
          s.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
          (s.speaker_name ?? s.speaker_label)
            .toLowerCase()
            .includes(transcriptSearch.toLowerCase())
      )
    : displaySegments;

  // ── Virtualization ─────────────────────────────────────────────────────────
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredSegments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // rough estimate of a segment's height
    overscan: 10,
  });

  const seekToSegment = useCallback((seg: TranscriptSegment) => {
    setActiveSegmentId(seg.id);
    if (videoRef.current) {
      videoRef.current.currentTime = seg.start_time;
      void videoRef.current.play();
    }
    const idx = filteredSegments.findIndex((s) => s.id === seg.id);
    if (idx !== -1) {
      rowVirtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    }
  }, [filteredSegments, rowVirtualizer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || displaySegments.length === 0) return;
    
    let lastIndex = 0;
    function onTimeUpdate() {
      const t = video!.currentTime;
      // Fast path: still in same segment
      if (displaySegments[lastIndex] && t >= displaySegments[lastIndex].start_time && t <= displaySegments[lastIndex].end_time) {
        setActiveSegmentId(prev => prev !== displaySegments[lastIndex].id ? displaySegments[lastIndex].id : prev);
        return;
      }
      // Fast path: next segment (normal playback progression)
      if (displaySegments[lastIndex + 1] && t >= displaySegments[lastIndex + 1].start_time && t <= displaySegments[lastIndex + 1].end_time) {
        lastIndex++;
        setActiveSegmentId(prev => prev !== displaySegments[lastIndex].id ? displaySegments[lastIndex].id : prev);
        return;
      }
      // Fallback: user seeked video
      const idx = displaySegments.findIndex(s => t >= s.start_time && t <= s.end_time);
      if (idx !== -1) {
        lastIndex = idx;
        setActiveSegmentId(prev => prev !== displaySegments[idx].id ? displaySegments[idx].id : prev);
      }
    }
    
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [displaySegments]);

  // If the active segment changes via time update, we don't automatically scroll unless requested,
  // but for now we won't auto-scroll to avoid fighting user scroll.

  const tabs: { key: InsightsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "summary", label: "Summary", icon: Lightbulb },
    { key: "decisions", label: `Decisions (${displayDecisions.length})`, icon: Gavel },
    { key: "actions", label: `Actions (${displayActions.length})`, icon: ListChecks },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link href="/meetings">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Meetings
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1 min-w-0">
            {meetingLoading ? (
              <div className="h-4 w-64 rounded bg-muted animate-pulse" />
            ) : (
              <h1 className="text-base font-semibold text-foreground truncate">
                {meeting?.title ?? "Meeting Details"}
              </h1>
            )}
          </div>
          {!meetingLoading && meeting && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
              {meeting.duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(meeting.duration_seconds)}
                </span>
              )}
              {meeting.participant_count && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {meeting.participant_count} participants
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0 bg-background">
          {/* Transcript header + search */}
          <div className="px-6 py-4 max-w-[80ch] flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transcript
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search transcript…"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
                  aria-label="Search transcript"
                />
              </div>
            </div>
          </div>

          {/* Virtualized list container */}
          <div 
            ref={parentRef}
            className="flex-1 overflow-y-auto px-6 pb-4"
          >
            <div className="max-w-[80ch]">
              {segmentsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-20 rounded-full bg-muted" />
                        <div className="h-3 w-10 rounded bg-muted" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-5/6 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSegments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {transcriptSearch ? `No results for "${transcriptSearch}"` : "No transcript segments yet."}
                </p>
              ) : (
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                  role="log" 
                  aria-label="Meeting transcript"
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const seg = filteredSegments[virtualRow.index];
                    const isActive = seg.id === activeSegmentId;
                    return (
                      <article
                        key={seg.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className={cn(
                          "absolute top-0 left-0 w-full group rounded-lg p-3 transition-colors",
                          isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                        )}
                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                        aria-label={`${seg.speaker_name ?? seg.speaker_label} at ${formatTime(seg.start_time)}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", speakerColor(seg.speaker_label))}>
                            {seg.speaker_name ?? seg.speaker_label}
                          </span>
                          <button
                            onClick={() => seekToSegment(seg)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                            aria-label={`Seek to ${formatTime(seg.start_time)}`}
                          >
                            <Play className="h-2.5 w-2.5" />
                            {formatTime(seg.start_time)}
                          </button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{seg.text}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Video Player */}
          {meeting?.source_url && (
            <div className="flex-shrink-0 border-t border-border bg-muted p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5" />
                  Recording Playback
                </div>
              </div>
              <video
                ref={videoRef}
                src={meeting.source_url}
                controls
                className="w-full rounded-md border border-border"
                aria-label="Meeting recording"
              />
            </div>
          )}
        </div>

        {/* Right pane */}
        <aside className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden bg-background">
          <div className="flex border-b border-border bg-background" role="tablist" aria-label="Meeting insights">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                aria-controls={`panel-${key}`}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "summary" && (
              <div id="panel-summary" role="tabpanel" aria-label="AI Summary">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    AI-generated ·{" "}
                    <span className="text-primary">verify with transcript</span>
                    {currentSummary && (
                      <span className="ml-2 text-muted-foreground/60">v{currentSummary.version}</span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isRegenerating || !meetingId}
                    onClick={() => meetingId && regenerate(meetingId)}
                  >
                    {isRegenerating ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Regenerating…</>
                    ) : (
                      "Regenerate"
                    )}
                  </Button>
                </div>
                {meetingLoading || summariesLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-4/6 rounded bg-muted" />
                  </div>
                ) : displaySummary ? (
                  <>
                    <div className="prose prose-sm dark:prose-invert text-sm text-foreground leading-relaxed max-w-none">
                      <ReactMarkdown>{displaySummary}</ReactMarkdown>
                    </div>
                    {displayKeyPoints.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Points</p>
                        <ul className="space-y-1">
                          {displayKeyPoints.map((point, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No summary available yet.</p>
                )}
              </div>
            )}

            {activeTab === "decisions" && (
              <div id="panel-decisions" role="tabpanel" aria-label="Decisions" className="space-y-3">
                {decisionsLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-16 w-full rounded-lg bg-muted" />
                    <div className="h-16 w-full rounded-lg bg-muted" />
                  </div>
                ) : displayDecisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No decisions logged.</p>
                ) : (
                  displayDecisions.map((d, i) => (
                    <Card key={d.id}>
                      <CardContent className="p-3">
                        <div className="flex gap-2.5">
                          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-snug">{d.text}</p>
                        </div>
                        {d.source_segment_id && (
                          <button
                            onClick={() => {
                              const seg = displaySegments.find((s) => s.id === d.source_segment_id);
                              if (seg) seekToSegment(seg);
                            }}
                            className="mt-2 ml-7 text-[11px] text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                          >
                            View in transcript <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "actions" && (
              <div id="panel-actions" role="tabpanel" aria-label="Action Items" className="space-y-2">
                {actionsLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-16 w-full rounded-lg bg-muted" />
                    <div className="h-16 w-full rounded-lg bg-muted" />
                  </div>
                ) : displayActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No action items logged.</p>
                ) : (
                  displayActions.map((item) => {
                    const done = item.status === "completed";
                    return (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => toggleActionItem(item)}
                              aria-label={done ? `Mark incomplete: ${item.text}` : `Mark complete: ${item.text}`}
                              className="flex-shrink-0 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                            >
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-sm leading-snug", done && "line-through text-muted-foreground")}>
                                {item.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {item.assignee && (
                                  <p className="text-[11px] text-muted-foreground">→ {item.assignee}</p>
                                )}
                                {item.source_segment_id && (
                                  <button
                                    onClick={() => {
                                      const seg = displaySegments.find((s) => s.id === item.source_segment_id);
                                      if (seg) seekToSegment(seg);
                                    }}
                                    className="text-[11px] text-primary hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                                  >
                                    Source <ChevronRight className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
