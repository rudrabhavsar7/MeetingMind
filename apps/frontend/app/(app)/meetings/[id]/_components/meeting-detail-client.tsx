"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  AlertTriangle,
  Search,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMeeting, useTranscriptSegments, useActionItems, useDecisions, usePatchActionItem } from "@/lib/queries/meetings";
import type { TranscriptSegment, ActionItem, Decision } from "@/types/api.types";

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_SEGMENTS: TranscriptSegment[] = [
  { id: "s1", meeting_id: "m1", speaker_label: "Speaker 1", speaker_name: "Rudra", text: "Alright, let's kick off the Q3 planning session. I want to start with the AI pipeline — we need to finalize the streaming architecture before we can commit to a timeline.", start_time: 0, end_time: 18, created_at: "" },
  { id: "s2", meeting_id: "m1", speaker_label: "Speaker 2", speaker_name: "Prashant", text: "I've been thinking about this. We should definitely go with WebSocket for the extension-to-backend stream. The latency requirements for live transcription make polling completely infeasible.", start_time: 19, end_time: 38, created_at: "" },
  { id: "s3", meeting_id: "m1", speaker_label: "Speaker 3", speaker_name: "Jenil", text: "Agreed on WebSocket. What about the STT provider? Are we locked into Whisper or should we keep the interface abstract enough to swap providers later?", start_time: 39, end_time: 56, created_at: "" },
  { id: "s4", meeting_id: "m1", speaker_label: "Speaker 1", speaker_name: "Rudra", text: "The plan is to use faster-whisper locally as the default. The abstraction layer is important — we should define a clean interface so operators can swap in their own STT if needed.", start_time: 57, end_time: 78, created_at: "" },
  { id: "s5", meeting_id: "m1", speaker_label: "Speaker 2", speaker_name: "Prashant", text: "On the frontend side, I'll need the WebSocket events spec finalized before I can build the live transcript UI in the extension side panel. Can we document that this week?", start_time: 79, end_time: 97, created_at: "" },
  { id: "s6", meeting_id: "m1", speaker_label: "Speaker 3", speaker_name: "Jenil", text: "I'll own that. I'll write up the event spec — transcript_interim, transcript_final, action_item_detected, summary_updated, meeting_completed — and share it in Notion by Thursday.", start_time: 98, end_time: 118, created_at: "" },
  { id: "s7", meeting_id: "m1", speaker_label: "Speaker 1", speaker_name: "Rudra", text: "Perfect. Let's also talk about the RAG pipeline. We need pgvector indexes set up before we can run any embedding queries. Arnish, is the Docker Compose ready?", start_time: 119, end_time: 138, created_at: "" },
  { id: "s8", meeting_id: "m1", speaker_label: "Speaker 4", speaker_name: "Arnish", text: "The Docker Compose is up. PostgreSQL with pgvector extension is running, Redis is up. The only thing missing is the Ollama service — I need to figure out GPU routing for the GPU worker container.", start_time: 139, end_time: 161, created_at: "" },
];

const MOCK_ACTIONS: ActionItem[] = [
  { id: "a1", meeting_id: "m1", text: "Jenil to document WebSocket event spec by Thursday", assignee: "Jenil", due_date: null, status: "open", source_segment_id: "s6", created_at: "" },
  { id: "a2", meeting_id: "m1", text: "Arnish to figure out GPU routing for Ollama container", assignee: "Arnish", due_date: null, status: "open", source_segment_id: "s8", created_at: "" },
  { id: "a3", meeting_id: "m1", text: "Rudra to define STT provider abstraction interface", assignee: "Rudra", due_date: null, status: "completed", source_segment_id: "s4", created_at: "" },
];

const MOCK_DECISIONS: Decision[] = [
  { id: "d1", meeting_id: "m1", text: "Use WebSocket for extension-to-backend audio streaming (rejected HTTP polling due to latency)", source_segment_id: "s2", created_at: "" },
  { id: "d2", meeting_id: "m1", text: "faster-whisper is the default STT provider; abstraction layer required for operator swap-out", source_segment_id: "s4", created_at: "" },
];

const MOCK_SUMMARY = `The team finalized the real-time streaming architecture for the MeetingMind AI pipeline. **WebSocket** was chosen over HTTP polling for extension-to-backend audio streaming due to live transcription latency requirements.

**faster-whisper** was selected as the default local STT provider, with a clean abstraction layer to allow operators to swap providers.

The infrastructure is largely ready — PostgreSQL with pgvector and Redis are running in Docker Compose. GPU routing for the Ollama container remains the only outstanding infrastructure blocker.

The WebSocket event specification will be documented by Jenil by Thursday, unblocking the extension side panel UI.`;

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

// Speaker colour palette — consistent colours per label
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

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function TranscriptSkeleton() {
  return (
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
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse p-4">
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-3 w-4/6 rounded bg-muted" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MeetingDetailClient() {
  const params = useParams<{ id: string }>();
  const meetingId = params?.id;

  const [activeTab, setActiveTab] = useState<InsightsTab>("summary");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const segmentRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId);
  const { data: segments, isLoading: segmentsLoading } = useTranscriptSegments(meetingId);
  const { data: actionItems, isLoading: actionsLoading } = useActionItems(meetingId);
  const { data: decisions, isLoading: decisionsLoading } = useDecisions(meetingId);

  // Fall back to mock data
  const displaySegments = segments ?? MOCK_SEGMENTS;
  const displayActions = actionItems ?? MOCK_ACTIONS;
  const displayDecisions = decisions ?? MOCK_DECISIONS;

  // Local state for optimistic action item toggling
  const [localActionStatus, setLocalActionStatus] = useState<Record<string, "open" | "completed">>({});
  const { mutate: patchItem } = usePatchActionItem();

  function toggleActionItem(item: ActionItem) {
    const newStatus = (localActionStatus[item.id] ?? item.status) === "open" ? "completed" : "open";
    setLocalActionStatus((prev) => ({ ...prev, [item.id]: newStatus }));
    if (meetingId) {
      patchItem({ meetingId, itemId: item.id, status: newStatus });
    }
  }

  // ── Transcript search filter ───────────────────────────────────────────────
  const filteredSegments = transcriptSearch.trim()
    ? displaySegments.filter(
        (s) =>
          s.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
          (s.speaker_name ?? s.speaker_label)
            .toLowerCase()
            .includes(transcriptSearch.toLowerCase())
      )
    : displaySegments;

  // ── Seek video on segment click (MM-504) ──────────────────────────────────
  const seekToSegment = useCallback((seg: TranscriptSegment) => {
    setActiveSegmentId(seg.id);
    if (videoRef.current) {
      videoRef.current.currentTime = seg.start_time;
      void videoRef.current.play();
    }
    // Scroll the segment into view
    segmentRefs.current[seg.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ── Sync active segment with video playback ────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function onTimeUpdate() {
      const t = video!.currentTime;
      const active = displaySegments.find(
        (s) => t >= s.start_time && t <= s.end_time
      );
      if (active) setActiveSegmentId(active.id);
    }
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [displaySegments]);

  const tabs: { key: InsightsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "summary", label: "Summary", icon: Lightbulb },
    { key: "decisions", label: `Decisions (${displayDecisions.length})`, icon: Gavel },
    { key: "actions", label: `Actions (${displayActions.length})`, icon: ListChecks },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
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

      {/* Body: split-pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left pane: Transcript (60%) ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <div className="px-6 py-4 max-w-[80ch]">
            {/* Transcript header + search */}
            <div className="flex items-center justify-between mb-4 gap-3">
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

            {segmentsLoading ? (
              <TranscriptSkeleton />
            ) : filteredSegments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {transcriptSearch ? `No results for "${transcriptSearch}"` : "No transcript segments yet."}
              </p>
            ) : (
              <div className="space-y-4" role="log" aria-label="Meeting transcript">
                {filteredSegments.map((seg) => {
                  const isActive = seg.id === activeSegmentId;
                  return (
                    <article
                      key={seg.id}
                      ref={(el) => { segmentRefs.current[seg.id] = el; }}
                      className={cn(
                        "group rounded-lg p-3 transition-colors scroll-mt-4",
                        isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      )}
                      aria-label={`${seg.speaker_name ?? seg.speaker_label} at ${formatTime(seg.start_time)}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Speaker chip */}
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", speakerColor(seg.speaker_label))}>
                          {seg.speaker_name ?? seg.speaker_label}
                        </span>
                        {/* Timestamp button — seeks video (MM-504) */}
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

            {/* ── Video Player (MM-504) — shown if media URL available ───── */}
            {meeting?.source_url && (
              <div className="mt-8 rounded-lg overflow-hidden border border-border bg-muted">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-xs text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5" />
                  Recording Playback
                </div>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  ref={videoRef}
                  src={meeting.source_url}
                  controls
                  className="w-full"
                  aria-label="Meeting recording"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right pane: Insights (40%) ───────────────────────────────────── */}
        <aside className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden">
          {/* Tab bar */}
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

          {/* Tab panels */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* ── Summary ────────────────────────────────────────────────── */}
            {activeTab === "summary" && (
              <div id="panel-summary" role="tabpanel" aria-label="AI Summary">
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-primary" />
                  AI-generated ·{" "}
                  <span className="text-primary">verify with transcript</span>
                </p>
                {meetingLoading ? (
                  <InsightsSkeleton />
                ) : (
                  MOCK_SUMMARY.split("\n\n").map((para, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-wrap">
                      {para}
                    </p>
                  ))
                )}
              </div>
            )}

            {/* ── Decisions ──────────────────────────────────────────────── */}
            {activeTab === "decisions" && (
              <div id="panel-decisions" role="tabpanel" aria-label="Decisions" className="space-y-3">
                {decisionsLoading ? (
                  <InsightsSkeleton />
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

            {/* ── Action Items ────────────────────────────────────────────── */}
            {activeTab === "actions" && (
              <div id="panel-actions" role="tabpanel" aria-label="Action Items" className="space-y-2">
                {actionsLoading ? (
                  <InsightsSkeleton />
                ) : displayActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No action items logged.</p>
                ) : (
                  displayActions.map((item) => {
                    const done = (localActionStatus[item.id] ?? item.status) === "completed";
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
